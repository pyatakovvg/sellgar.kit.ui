import { TableRuntime } from '../table-runtime';
import { elementScale } from './coordinate-space';
import { HeaderScroll } from './header-scroll';
import { LastRowObserver } from './last-row-observer';
import { observePosition } from './position-observer';
import { TablePresentation } from './table-presentation';
import { ContentWidths } from './content-widths';

import type { TableColumnGeometry, TableMeasurement } from '../types';
import type { HeaderPlacement } from './table-presentation';

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

const innerRect = (element: HTMLElement) => {
  const rect = element.getBoundingClientRect();
  const scaleX = elementScale(element, 'X');
  const scaleY = elementScale(element, 'Y');
  const left = rect.left + element.clientLeft * scaleX;
  const top = rect.top + element.clientTop * scaleY;
  return { left, top, right: left + element.clientWidth * scaleX, bottom: top + element.clientHeight * scaleY };
};

export class TableBrowser {
  private root?: HTMLElement;
  private surface?: HTMLElement;
  private probe?: HTMLElement;
  private scroller?: HTMLElement;
  private scrollHost?: HTMLElement;
  private owner?: HTMLElement | Window;
  private header?: HTMLElement;
  private fixedProbe?: HTMLElement;
  private parent?: TableBrowser;
  private readonly nested = new Map<string, { root: HTMLElement; minimum: number }>();
  private scale = 1;
  private cssScale = 1;
  private scaleY = 1;
  private pointer?: { id: number; clientX: number; target: HTMLElement; pinned: boolean };
  private readonly pending = new Map<string, TableMeasurement>();
  private readonly measurementReaders = new Map<HTMLElement, () => void>();
  private measurementVersion = -1;
  private readonly headerScroll = new HeaderScroll();
  private readonly lastRowObserver = new LastRowObserver();
  private readonly presentation = new TablePresentation();
  private headerPlacement?: HeaderPlacement;
  private presenting = false;
  private frame = 0;
  private readonly contentWidths = new ContentWidths(() => this.schedule());

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
    this.measurementVersion = -1;
    const releaseContentWidths = this.contentWidths.attach(root);
    const unsubscribe = this.runtime.subscribe(() => this.present());
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
    let ancestor = root.parentElement;
    while (ancestor) {
      observer.observe(ancestor);
      ancestor = ancestor.parentElement;
    }
    const releasePosition = observePosition(surface, refresh);
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
    root.addEventListener('pointermove', move);
    root.addEventListener('pointerup', up);
    root.addEventListener('pointercancel', cancel);
    root.addEventListener('lostpointercapture', cancel);
    const doubleClick = (event: MouseEvent) => this.resetFromDoubleClick(event);
    root.addEventListener('dblclick', doubleClick);
    const focus = (event: FocusEvent) => this.revealFocusedCell(event);
    root.addEventListener('focusin', focus);
    window.addEventListener('scroll', refresh, true);
    window.addEventListener('resize', refresh);
    this.refresh();
    return () => {
      this.endResize(true);
      this.lastRowObserver.clear();
      this.headerScroll.clear();
      releaseContentWidths();
      unsubscribe();
      observer.disconnect();
      releasePosition();
      root.removeEventListener('pointermove', move);
      root.removeEventListener('pointerup', up);
      root.removeEventListener('pointercancel', cancel);
      root.removeEventListener('lostpointercapture', cancel);
      root.removeEventListener('dblclick', doubleClick);
      root.removeEventListener('focusin', focus);
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

  observeLastRow(
    element: HTMLElement,
    rowId: string,
    onVisible: () => void,
    options: { readonly rootMargin?: number; readonly threshold?: number },
  ): () => void {
    const owner = this.scrollOwner();
    return this.lastRowObserver.observe(
      element,
      rowId,
      owner instanceof HTMLElement ? owner : null,
      onVisible,
      options,
    );
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

  attachHeaderPlacement(mount: HTMLElement, slot: HTMLElement, portal: HTMLElement): () => void {
    const placement = { mount, slot, portal };
    this.headerPlacement = placement;
    this.present();
    return () => {
      if (this.headerPlacement === placement) this.headerPlacement = undefined;
    };
  }

  present(): void {
    if (!this.root || !this.surface || this.presenting) return;
    this.presenting = true;
    try {
      const moved = this.presentation.apply(this.root, this.surface, this.runtime.getSnapshot(), this.headerPlacement);
      if (moved) {
        this.refresh();
        this.presentation.apply(this.root, this.surface, this.runtime.getSnapshot(), this.headerPlacement);
      }
      this.syncHeaderScroll();
      if (this.measurementVersion !== this.runtime.getSnapshot().version) this.schedule();
    } finally {
      this.presenting = false;
    }
  }

  attachHeader(header: HTMLElement): () => void {
    this.header = header;
    const fixedProbe = document.createElement('span');
    fixedProbe.style.cssText =
      'position:fixed;left:var(--numbers-0);top:var(--numbers-0);width:var(--numbers-100);height:var(--numbers-100);visibility:hidden;pointer-events:none';
    fixedProbe.ariaHidden = 'true';
    header.parentElement?.appendChild(fixedProbe);
    this.fixedProbe = fixedProbe;
    const observer = new ResizeObserver(() => this.schedule());
    observer.observe(header);
    const blur = () => this.endResize(true);
    const key = (event: KeyboardEvent) => {
      if (event.key === 'Escape') this.endResize(true);
    };
    const visibility = () => {
      if (document.hidden) this.endResize(true);
    };
    const wheel = (event: WheelEvent) => this.scrollFromHeader(event);
    header.addEventListener('wheel', wheel, { passive: false });
    window.addEventListener('blur', blur);
    window.addEventListener('keydown', key);
    document.addEventListener('visibilitychange', visibility);
    this.refresh();
    return () => {
      this.endResize(true);
      this.headerScroll.clear();
      observer.disconnect();
      header.removeEventListener('wheel', wheel);
      window.removeEventListener('blur', blur);
      window.removeEventListener('keydown', key);
      document.removeEventListener('visibilitychange', visibility);
      fixedProbe.remove();
      this.fixedProbe = undefined;
      this.header = undefined;
    };
  }

  syncHeaderScroll(): void {
    if (!this.header || !this.scroller) return;
    this.headerScroll.sync(
      this.header,
      this.scroller,
      this.runtime.getSnapshot().viewport.left,
      elementScale(this.scroller, 'X') / this.scale,
    );
  }

  beginResize(columnId: string, event: PointerEvent): void {
    if (!event.isPrimary || event.button !== 0 || this.pointer || !this.header || !this.root) return;
    const column = this.runtime.getSnapshot().columns.find((item) => item.id === columnId);
    if (!column) return;
    const pinned = column.region !== 'center';
    if (!this.beginColumnResize(column, this.pointerX(event.clientX, pinned))) return;
    event.preventDefault();
    this.pointer = { id: event.pointerId, clientX: event.clientX, target: this.root, pinned };
    this.root.setPointerCapture(event.pointerId);
  }

  resizeBy(columnId: string, delta: number): void {
    const column = this.runtime.getSnapshot().columns.find((item) => item.id === columnId);
    if (!column || !this.beginColumnResize(column, 0)) return;
    this.runtime.moveResize(delta);
    this.runtime.finishResize();
  }

  resetColumnWidth(columnId: string): void {
    if (!this.pointer) this.runtime.resetColumnWidth(columnId);
  }

  private resetFromDoubleClick(event: MouseEvent): void {
    const root = this.root;
    if (!root) return;
    // Pointer capture retargets native clicks to the stable table root.
    const target =
      event.target === root ? root.ownerDocument.elementFromPoint(event.clientX, event.clientY) : event.target;
    const handle = target instanceof Element ? target.closest('[data-resize-column]') : null;
    if (!handle || handle.closest('[data-table="geometry"]') !== root) return;
    event.preventDefault();
    event.stopPropagation();
    this.resetColumnWidth(handle.getAttribute('data-resize-column')!);
  }

  observeCell(element: HTMLElement, rowId: string, columnId: string, measureContent = false): () => void {
    const releaseContent = measureContent ? this.contentWidths.observe(element, columnId) : undefined;
    const releaseHeight = this.observeMeasurement(element, JSON.stringify([rowId, columnId]), () => {
      const parent = element.parentElement;
      const style = parent ? getComputedStyle(parent) : undefined;
      const borders = style ? Number.parseFloat(style.borderTopWidth) + Number.parseFloat(style.borderBottomWidth) : 0;
      return {
        rowId,
        columnId,
        version: this.runtime.getSnapshot().version,
        height:
          (element.getBoundingClientRect().height + borders * (parent ? elementScale(parent, 'Y') : 1)) / this.scaleY,
      };
    });
    return () => {
      releaseContent?.();
      releaseHeight();
    };
  }

  observeHeaderContent(element: HTMLElement, columnId: string): () => void {
    return this.contentWidths.observe(element, columnId);
  }

  observeExpanded(element: HTMLElement, rowId: string): () => void {
    return this.observeMeasurement(element, JSON.stringify([rowId, 'expanded']), () => ({
      kind: 'expanded',
      rowId,
      version: this.runtime.getSnapshot().version,
      height: element.getBoundingClientRect().height / this.scaleY,
    }));
  }

  observeEmpty(element: HTMLElement): () => void {
    return this.observeMeasurement(element, 'empty', () => ({
      kind: 'empty',
      version: this.runtime.getSnapshot().version,
      height: element.getBoundingClientRect().height / this.scaleY,
    }));
  }

  private observeMeasurement(element: HTMLElement, key: string, read: () => TableMeasurement): () => void {
    const measure = () => {
      this.pending.set(key, read());
    };
    this.measurementReaders.set(element, measure);
    const observer = new ResizeObserver(() => {
      measure();
      this.schedule();
    });
    observer.observe(element);
    measure();
    this.schedule();
    return () => {
      observer.disconnect();
      this.measurementReaders.delete(element);
      this.pending.delete(key);
    };
  }

  correctScroll(correction: number): void {
    const owner = this.scrollOwner();
    if (!correction || !owner) return;
    const ownerScale = owner instanceof HTMLElement ? elementScale(owner, 'Y') : 1;
    owner.scrollBy({ top: (correction * this.scaleY) / ownerScale, behavior: 'instant' });
  }

  toggleExpanded(rowId: string): void {
    const correction = this.runtime.toggleExpanded(rowId);
    this.correctScroll(correction);
  }

  toggleTree(rowId: string): void {
    const correction = this.runtime.toggleTree(rowId);
    this.correctScroll(correction);
  }

  refresh(): void {
    if (!this.root || !this.surface || !this.probe || !this.scroller || !this.owner) return;
    const previous = this.runtime.getSnapshot().viewport;
    const probeWidth = this.probe.getBoundingClientRect().width;
    this.scale = probeWidth / 100 || 1;
    this.cssScale = probeWidth / (Number.parseFloat(getComputedStyle(this.probe).width) || 100) || 1;
    const themeUnit = (Number.parseFloat(getComputedStyle(this.probe).width) || 100) / 100;
    const verticalCssScale = this.fixedProbe ? elementScale(this.fixedProbe, 'Y') : elementScale(this.surface, 'Y');
    this.scaleY = themeUnit * verticalCssScale || 1;
    const rootRect = this.surface.getBoundingClientRect();
    for (const [id, child] of this.nested) {
      const offset = (child.root.getBoundingClientRect().left - rootRect.left) / this.scale;
      const style = getComputedStyle(child.root);
      const borders =
        ((Number.parseFloat(style.borderLeftWidth) + Number.parseFloat(style.borderRightWidth)) * this.cssScale) /
        this.scale;
      this.runtime.setNestedWidth(id, Math.max(0, offset) + borders + child.minimum);
    }
    const owner = this.scrollOwner()!;
    const ownerRect = owner instanceof HTMLElement ? innerRect(owner) : undefined;
    let left = ownerRect?.left ?? 0;
    let top = ownerRect?.top ?? 0;
    let right = ownerRect?.right ?? document.documentElement.clientWidth;
    let bottom = ownerRect?.bottom ?? window.innerHeight;
    let parent = this.root.parentElement;
    while (parent && parent !== document.body && parent !== document.documentElement) {
      const style = getComputedStyle(parent);
      const rect = innerRect(parent);
      if (/(auto|scroll|hidden|clip)/.test(style.overflowX)) {
        left = Math.max(left, rect.left);
        right = Math.min(right, rect.right);
      }
      if (/(auto|scroll|hidden|clip)/.test(style.overflowY)) {
        top = Math.max(top, rect.top);
        bottom = Math.min(bottom, rect.bottom);
      }
      parent = parent.parentElement;
    }
    const scrollerRect = innerRect(this.scroller);
    const scrollerLeft = scrollerRect.left;
    left = Math.max(0, left, rootRect.left, scrollerLeft);
    right = Math.min(right, document.documentElement.clientWidth, scrollerRect.right);
    top = Math.max(0, top) + this.probe.getBoundingClientRect().height;
    bottom = Math.min(bottom, window.innerHeight);
    this.clipHeader(left, top, right, bottom);
    const parentViewport = this.parent?.runtime.getSnapshot().viewport;
    const parentLeft = this.parent?.surface?.getBoundingClientRect().left ?? rootRect.left;
    const rightInset =
      (this.root.getBoundingClientRect().right -
        (this.scrollHost?.getBoundingClientRect().right ?? this.root.getBoundingClientRect().right)) /
      this.scale;
    const available = parentViewport
      ? Math.max(
          0,
          (parentViewport.available ?? parentViewport.container) -
            Math.max(0, (rootRect.left - parentLeft) / this.scale) -
            rightInset,
        )
      : undefined;
    const previousLeft = previous.left;
    const nextLeft = (left - rootRect.left) / this.scale;
    const viewport = {
      container: ((this.parent ? this.root.clientWidth : this.scroller.clientWidth) * this.cssScale) / this.scale,
      available,
      width: Math.max(0, right - left) / this.scale,
      height: Math.max(0, bottom - top) / this.scaleY,
      scroll: (top - rootRect.top) / this.scaleY,
      left: nextLeft,
      top: top / this.scaleY,
      screenLeft: left / this.scale,
      originLeft: (this.fixedProbe?.getBoundingClientRect().left ?? 0) / this.scale,
      originTop: (this.fixedProbe?.getBoundingClientRect().top ?? 0) / this.scaleY,
      scale: this.scale,
      scaleY: this.scaleY,
    };
    this.runtime.updateViewport(viewport);
    this.lastRowObserver.refresh();
    this.syncHeaderScroll();
    if (!this.pointer) return;
    if (!this.runtime.getSnapshot().dragging) {
      this.endResize(false);
      return;
    }
    const environmentChanged =
      previous.container !== viewport.container ||
      previous.available !== viewport.available ||
      previous.scale !== viewport.scale ||
      (this.pointer.pinned && (previous.width !== viewport.width || previous.screenLeft !== viewport.screenLeft)) ||
      (Math.abs(previousLeft - nextLeft) < 1e-7 && previous.screenLeft !== viewport.screenLeft);
    if (environmentChanged) this.runtime.rebaseResize(this.pointerX(this.pointer.clientX));
    else if (!this.pointer.pinned && Math.abs(previousLeft - nextLeft) > 1e-7)
      this.runtime.moveResize(this.pointerX(this.pointer.clientX));
  }

  private scrollOwner(): HTMLElement | Window | undefined {
    return this.parent?.scrollOwner() ?? this.owner;
  }

  private beginColumnResize(column: TableColumnGeometry, x: number): boolean {
    return column.region === 'center'
      ? this.runtime.beginResize(column.id, x)
      : this.runtime.beginPinResize(column.id, x, column.resizeEdge);
  }

  private pointerX(clientX: number, pinned = this.pointer?.pinned ?? false): number {
    if (pinned) return clientX / this.scale - this.runtime.getSnapshot().viewport.screenLeft;
    return (clientX - (this.surface?.getBoundingClientRect().left ?? 0)) / this.scale;
  }

  private revealFocusedCell(event: FocusEvent): void {
    const target = event.target;
    const state = this.runtime.getSnapshot();
    if (
      !(target instanceof HTMLElement) ||
      !this.scroller ||
      !state.regions ||
      target.closest('[data-table="geometry"]') !== this.root ||
      target.closest('[data-column-id]')?.getAttribute('data-column-region') !== 'center'
    )
      return;

    const rect = target.getBoundingClientRect();
    const start = rect.left / this.scale - state.viewport.screenLeft;
    const end = rect.right / this.scale - state.viewport.screenLeft;
    const region = state.regions.center;
    const delta =
      start < region.start
        ? start - region.start
        : end > region.end
          ? Math.min(end - region.end, Math.max(0, start - region.start))
          : 0;
    if (delta !== 0) this.scroller.scrollBy({ left: (delta * this.scale) / this.cssScale });
  }

  private clipHeader(left: number, top: number, right: number, bottom: number): void {
    const layer = this.header?.parentElement;
    if (!layer || layer.dataset.tableHeaderPosition !== 'portal' || !this.scrollHost) return;
    const rect = this.scrollHost.getBoundingClientRect();
    const radius = getComputedStyle(this.scrollHost).borderRadius;
    const insets = [rect.top - top, right - rect.right, bottom - rect.bottom, rect.left - left];
    const cssScale = this.fixedProbe ? elementScale(this.fixedProbe, 'X') : 1;
    const cssScaleY = this.fixedProbe ? elementScale(this.fixedProbe, 'Y') : 1;
    layer.style.setProperty(
      '--table-header-clip',
      `inset(${insets.map((value, index) => `${value / (index % 2 ? cssScale : cssScaleY)}px`).join(' ')} round ${radius})`,
    );
  }

  private endResize(cancel: boolean): void {
    const pointer = this.pointer;
    this.pointer = undefined;
    if (cancel) this.runtime.cancelResize();
    else this.runtime.finishResize();
    if (pointer?.target.hasPointerCapture(pointer.id)) pointer.target.releasePointerCapture(pointer.id);
    this.schedule();
  }

  private flush(): void {
    this.frame = 0;
    this.refresh();
    if (this.header) this.runtime.setHeaderHeight(this.header.getBoundingClientRect().height / this.scaleY);
    const state = this.runtime.getSnapshot();
    if (!state.dragging) {
      const widths = this.contentWidths.measure(
        state.contentEpoch,
        this.scale,
        new Set(state.columns.filter((column) => column.measureContent).map((column) => column.id)),
      );
      if (widths.length) this.runtime.commitContentWidths(widths, state.contentEpoch);
    }
    if (this.measurementVersion !== this.runtime.getSnapshot().version) {
      this.measurementVersion = this.runtime.getSnapshot().version;
      this.measurementReaders.forEach((measure) => measure());
    }
    const entries = [...this.pending.values()];
    this.pending.clear();
    const correction = this.runtime.commitMeasurements(entries);
    this.correctScroll(correction);
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
