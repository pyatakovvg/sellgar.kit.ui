import { TableRuntime } from '../table-runtime';

import type { TableMeasurement } from '../types';

const ANCHOR_LEASES = new WeakMap<HTMLElement, { count: number; previous: string }>();

const acquireAnchor = (element: HTMLElement): (() => void) => {
  const lease = ANCHOR_LEASES.get(element) ?? { count: 0, previous: element.style.overflowAnchor };
  lease.count++;
  ANCHOR_LEASES.set(element, lease);
  element.style.overflowAnchor = 'none';
  return () => {
    lease.count--;
    if (lease.count === 0) {
      element.style.overflowAnchor = lease.previous;
      ANCHOR_LEASES.delete(element);
    }
  };
};

const findScrollOwner = (root: HTMLElement, axis: 'X' | 'Y'): HTMLElement | Window => {
  let parent = root.parentElement;
  while (parent && parent !== document.body && parent !== document.documentElement) {
    if (/(auto|scroll)/.test(getComputedStyle(parent)[`overflow${axis}`])) return parent;
    parent = parent.parentElement;
  }
  return window;
};

export class TableBrowser {
  private root?: HTMLElement;
  private surface?: HTMLElement;
  private probe?: HTMLElement;
  private scroller?: HTMLElement;
  private scrollHost?: HTMLElement;
  private owner?: HTMLElement | Window;
  private header?: HTMLElement;
  private parent?: TableBrowser;
  private readonly nested = new Map<string, { root: HTMLElement; minimum: number }>();
  private scale = 1;
  private pointer?: { id: number; clientX: number };
  private readonly pending = new Map<string, TableMeasurement>();
  private frame = 0;

  constructor(private readonly runtime: TableRuntime) {}

  attach(
    root: HTMLElement,
    surface: HTMLElement,
    probe: HTMLElement,
    scrollHost: HTMLElement,
    internal: boolean,
    parent?: TableBrowser,
  ): () => void {
    const scroller = findScrollOwner(surface, 'X');
    if (!(scroller instanceof HTMLElement) || (!parent && !root.contains(scroller)))
      throw new Error('Table requires its own horizontal scroll viewport');
    this.parent = parent;
    this.root = root;
    this.surface = surface;
    this.probe = probe;
    this.scroller = scroller;
    this.scrollHost = scrollHost;
    this.owner = internal ? scroller : findScrollOwner(root, 'Y');
    const scrollElement = this.owner instanceof HTMLElement ? this.owner : document.documentElement;
    const releaseAnchor = acquireAnchor(scrollElement);
    const releaseHorizontalAnchor = scroller === scrollElement ? undefined : acquireAnchor(scroller);
    const refresh = () => this.refresh();
    const observer = new ResizeObserver(() => this.schedule());
    observer.observe(root);
    observer.observe(scroller);
    observer.observe(scrollHost);
    observer.observe(surface);
    observer.observe(probe);
    window.addEventListener('scroll', refresh, true);
    window.addEventListener('resize', refresh);
    this.refresh();
    return () => {
      this.endResize(true);
      observer.disconnect();
      window.removeEventListener('scroll', refresh, true);
      window.removeEventListener('resize', refresh);
      releaseAnchor();
      releaseHorizontalAnchor?.();
      if (this.frame) cancelAnimationFrame(this.frame);
      this.frame = 0;
      this.pending.clear();
      this.root = undefined;
      this.surface = undefined;
      this.probe = undefined;
      this.scroller = undefined;
      this.scrollHost = undefined;
      this.owner = undefined;
      this.parent = undefined;
    };
  }

  observeNested(id: string, root: HTMLElement, runtime: TableRuntime): () => void {
    const child = { root, minimum: runtime.getSnapshot().minimumWidth };
    this.nested.set(id, child);
    const unsubscribe = runtime.subscribe(() => {
      const minimum = runtime.getSnapshot().minimumWidth;
      if (minimum === child.minimum) return;
      child.minimum = minimum;
      this.schedule();
    });
    const observer = new ResizeObserver(() => this.schedule());
    observer.observe(root);
    this.schedule();
    return () => {
      observer.disconnect();
      unsubscribe();
      this.nested.delete(id);
      this.runtime.setNestedWidth(id, undefined);
      this.schedule();
    };
  }

  attachHeader(header: HTMLElement): () => void {
    this.header = header;
    const observer = new ResizeObserver(() => this.schedule());
    observer.observe(header);
    const move = (event: PointerEvent) => {
      if (event.pointerId !== this.pointer?.id) return;
      if (!(event.buttons & 1)) this.endResize(false);
      else {
        this.pointer.clientX = event.clientX;
        this.runtime.moveResize(this.pointerX(event.clientX));
      }
    };
    const up = (event: PointerEvent) => {
      if (event.pointerId === this.pointer?.id) this.endResize(false);
    };
    const cancel = (event: PointerEvent) => {
      if (event.pointerId === this.pointer?.id) this.endResize(true);
    };
    const blur = () => this.endResize(true);
    const key = (event: KeyboardEvent) => {
      if (event.key === 'Escape') this.endResize(true);
    };
    const visibility = () => {
      if (document.hidden) this.endResize(true);
    };
    const wheel = (event: WheelEvent) => this.scrollFromHeader(event);
    header.addEventListener('pointermove', move);
    header.addEventListener('pointerup', up);
    header.addEventListener('pointercancel', cancel);
    header.addEventListener('lostpointercapture', cancel);
    header.addEventListener('wheel', wheel, { passive: false });
    window.addEventListener('blur', blur);
    window.addEventListener('keydown', key);
    document.addEventListener('visibilitychange', visibility);
    this.refresh();
    return () => {
      this.endResize(true);
      observer.disconnect();
      header.removeEventListener('pointermove', move);
      header.removeEventListener('pointerup', up);
      header.removeEventListener('pointercancel', cancel);
      header.removeEventListener('lostpointercapture', cancel);
      header.removeEventListener('wheel', wheel);
      window.removeEventListener('blur', blur);
      window.removeEventListener('keydown', key);
      document.removeEventListener('visibilitychange', visibility);
      this.header = undefined;
    };
  }

  beginResize(columnId: string, event: PointerEvent): void {
    if (!event.isPrimary || event.button !== 0 || this.pointer || !this.header) return;
    if (!this.runtime.beginResize(columnId, this.pointerX(event.clientX))) return;
    event.preventDefault();
    this.pointer = { id: event.pointerId, clientX: event.clientX };
    this.header.setPointerCapture(event.pointerId);
  }

  observeCell(element: HTMLElement, rowId: string, columnId: string, version: number): () => void {
    const observer = new ResizeObserver(() => {
      const parent = element.parentElement;
      const style = parent ? getComputedStyle(parent) : undefined;
      const borders = style ? Number.parseFloat(style.borderTopWidth) + Number.parseFloat(style.borderBottomWidth) : 0;
      const entry = {
        rowId,
        columnId,
        version,
        height: (element.getBoundingClientRect().height + borders) / this.scale,
      };
      this.pending.set(JSON.stringify([rowId, columnId]), entry);
      this.schedule();
    });
    observer.observe(element);
    return () => observer.disconnect();
  }

  observeExpanded(element: HTMLElement, rowId: string, version: number): () => void {
    const observer = new ResizeObserver(() => {
      this.pending.set(JSON.stringify([rowId, 'expanded']), {
        kind: 'expanded',
        rowId,
        version,
        height: element.getBoundingClientRect().height / this.scale,
      });
      this.schedule();
    });
    observer.observe(element);
    return () => observer.disconnect();
  }

  toggleExpanded(rowId: string): void {
    const correction = this.runtime.toggleExpanded(rowId);
    if (correction) this.scrollOwner()?.scrollBy({ top: correction * this.scale });
  }

  refresh(): void {
    if (!this.root || !this.surface || !this.probe || !this.scroller || !this.owner) return;
    this.scale = this.probe.getBoundingClientRect().width / 100 || 1;
    const rootRect = this.surface.getBoundingClientRect();
    for (const [id, child] of this.nested) {
      const offset = (child.root.getBoundingClientRect().left - rootRect.left) / this.scale;
      this.runtime.setNestedWidth(id, Math.max(0, offset) + child.minimum);
    }
    const owner = this.scrollOwner()!;
    const ownerRect = owner instanceof HTMLElement ? owner.getBoundingClientRect() : undefined;
    let left = ownerRect && owner instanceof HTMLElement ? ownerRect.left + owner.clientLeft : 0;
    let top = ownerRect && owner instanceof HTMLElement ? ownerRect.top + owner.clientTop : 0;
    let right = left + (owner instanceof HTMLElement ? owner.clientWidth : document.documentElement.clientWidth);
    let bottom = top + (owner instanceof HTMLElement ? owner.clientHeight : window.innerHeight);
    let parent = this.root.parentElement;
    while (parent && parent !== document.body && parent !== document.documentElement) {
      const style = getComputedStyle(parent);
      const rect = parent.getBoundingClientRect();
      if (/(auto|scroll|hidden|clip)/.test(style.overflowX)) {
        left = Math.max(left, rect.left + parent.clientLeft);
        right = Math.min(right, rect.left + parent.clientLeft + parent.clientWidth);
      }
      if (/(auto|scroll|hidden|clip)/.test(style.overflowY)) {
        top = Math.max(top, rect.top + parent.clientTop);
        bottom = Math.min(bottom, rect.top + parent.clientTop + parent.clientHeight);
      }
      parent = parent.parentElement;
    }
    const scrollerRect = this.scroller.getBoundingClientRect();
    const scrollerLeft = scrollerRect.left + this.scroller.clientLeft;
    left = Math.max(0, left, rootRect.left, scrollerLeft);
    right = Math.min(right, document.documentElement.clientWidth, scrollerLeft + this.scroller.clientWidth);
    top = Math.max(0, top) + this.probe.getBoundingClientRect().height;
    bottom = Math.min(bottom, window.innerHeight);
    this.clipHeader(left, top, right, bottom);
    const previousLeft = this.runtime.getSnapshot().viewport.left;
    const nextLeft = (left - rootRect.left) / this.scale;
    this.runtime.updateViewport({
      container: (this.parent ? this.root.clientWidth : this.scroller.clientWidth) / this.scale,
      width: Math.max(0, right - left) / this.scale,
      height: Math.max(0, bottom - top) / this.scale,
      scroll: (top - rootRect.top) / this.scale,
      left: nextLeft,
      top: top / this.scale,
      screenLeft: left / this.scale,
      scale: this.scale,
    });
    if (this.pointer && Math.abs(previousLeft - nextLeft) > 1e-7)
      this.runtime.moveResize(this.pointerX(this.pointer.clientX));
  }

  private scrollOwner(): HTMLElement | Window | undefined {
    return this.parent?.scrollOwner() ?? this.owner;
  }

  private pointerX(clientX: number): number {
    return (clientX - (this.surface?.getBoundingClientRect().left ?? 0)) / this.scale;
  }

  private clipHeader(left: number, top: number, right: number, bottom: number): void {
    const layer = this.header?.parentElement;
    if (!layer || !this.scrollHost) return;
    const rect = this.scrollHost.getBoundingClientRect();
    const radius = getComputedStyle(this.scrollHost).borderRadius;
    const insets = [rect.top - top, right - rect.right, bottom - rect.bottom, rect.left - left];
    layer.style.setProperty(
      '--table-header-clip',
      `inset(${insets.map((value) => `${value}px`).join(' ')} round ${radius})`,
    );
  }

  private endResize(cancel: boolean): void {
    const pointer = this.pointer;
    this.pointer = undefined;
    if (cancel) this.runtime.cancelResize();
    else this.runtime.finishResize();
    if (pointer && this.header?.hasPointerCapture(pointer.id)) this.header.releasePointerCapture(pointer.id);
  }

  private flush(): void {
    this.frame = 0;
    this.refresh();
    if (this.header) this.runtime.setHeaderHeight(this.header.getBoundingClientRect().height / this.scale);
    const entries = [...this.pending.values()];
    this.pending.clear();
    const correction = this.runtime.commitMeasurements(entries);
    if (correction) this.scrollOwner()?.scrollBy({ top: correction * this.scale });
    this.refresh();
  }

  private schedule(): void {
    if (!this.frame) this.frame = requestAnimationFrame(() => this.flush());
  }

  private scrollFromHeader(event: WheelEvent): void {
    if (!this.owner || !this.scroller || event.ctrlKey) return;
    const scrollOwner = this.scrollOwner()!;
    const owner = scrollOwner instanceof HTMLElement ? scrollOwner : document.documentElement;
    const scroller = this.scroller;
    const unit =
      event.deltaMode === 1
        ? Number.parseFloat(getComputedStyle(owner).lineHeight) || 20
        : event.deltaMode === 2
          ? owner.clientHeight
          : 1;
    const left = (event.shiftKey && !event.deltaX ? event.deltaY : event.deltaX) * unit;
    const top = (event.shiftKey && !event.deltaX ? 0 : event.deltaY) * unit;
    const horizontal =
      left < 0
        ? scroller.scrollLeft > 0
        : left > 0 && scroller.scrollLeft < scroller.scrollWidth - scroller.clientWidth;
    const vertical =
      top < 0 ? owner.scrollTop > 0 : top > 0 && owner.scrollTop < owner.scrollHeight - owner.clientHeight;
    if (!horizontal && !vertical) return;
    event.preventDefault();
    scroller.scrollBy({ left });
    scrollOwner.scrollBy({ top });
  }
}
