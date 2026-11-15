/** Measures only mounted content; no React renderers or off-screen rows are executed. */
export class ContentWidths {
  private root?: HTMLElement;
  private probe?: HTMLDivElement;
  private resizeObserver?: ResizeObserver;
  private readonly sources = new Map<HTMLElement, string>();
  private readonly dirty = new Set<HTMLElement>();
  private epoch = -1;

  constructor(private readonly schedule: () => void) {}

  attach(root: HTMLElement): () => void {
    this.root = root;
    const probe = document.createElement('div');
    probe.setAttribute('data-table-content-probe', 'true');
    probe.setAttribute('aria-hidden', 'true');
    probe.inert = true;
    Object.assign(probe.style, {
      position: 'absolute',
      visibility: 'hidden',
      pointerEvents: 'none',
      width: '0',
      height: '0',
      overflow: 'hidden',
      contain: 'strict',
    });
    root.append(probe);
    this.probe = probe;
    this.resizeObserver = new ResizeObserver((entries) => {
      entries.forEach(({ target }) => this.dirty.add(target as HTMLElement));
      this.schedule();
    });
    this.sources.forEach((_, element) => this.resizeObserver!.observe(element));
    const invalidate = () => {
      this.sources.forEach((_, element) => this.dirty.add(element));
      this.schedule();
    };
    const markTarget = (target: Node): boolean => {
      if (probe.contains(target)) return false;
      let element = target instanceof Element ? target : target.parentElement;
      if (element?.closest('[data-table="geometry"]') !== root) return false;
      let changed = false;
      while (element && element !== root) {
        if (element instanceof HTMLElement && this.sources.has(element)) {
          this.dirty.add(element);
          changed = true;
        }
        element = element.parentElement;
      }
      return changed;
    };
    const mutations = new MutationObserver((entries) => {
      let changed = false;
      for (const { target } of entries) if (markTarget(target)) changed = true;
      if (changed) this.schedule();
    });
    mutations.observe(root, { subtree: true, childList: true, characterData: true });
    const loaded = (event: Event) => {
      if (event.target instanceof Node && markTarget(event.target)) this.schedule();
    };
    root.addEventListener('load', loaded, true);
    document.fonts?.addEventListener('loadingdone', invalidate);
    invalidate();
    return () => {
      mutations.disconnect();
      this.resizeObserver?.disconnect();
      root.removeEventListener('load', loaded, true);
      document.fonts?.removeEventListener('loadingdone', invalidate);
      probe.remove();
      this.root = undefined;
      this.probe = undefined;
      this.resizeObserver = undefined;
    };
  }

  observe(element: HTMLElement, columnId: string): () => void {
    this.sources.set(element, columnId);
    this.dirty.add(element);
    this.resizeObserver?.observe(element);
    this.schedule();
    return () => {
      this.resizeObserver?.unobserve(element);
      this.sources.delete(element);
      this.dirty.delete(element);
    };
  }

  measure(epoch: number, scale: number, columns: ReadonlySet<string>): { columnId: string; width: number }[] {
    const probe = this.probe;
    if (!probe || !this.root) return [];
    if (this.epoch !== epoch) {
      this.epoch = epoch;
      this.sources.forEach((_, element) => this.dirty.add(element));
    }
    const clones: { element: HTMLElement; columnId: string }[] = [];
    for (const source of this.dirty) {
      const columnId = this.sources.get(source);
      if (
        !columnId ||
        !columns.has(columnId) ||
        !source.isConnected ||
        source.closest('[data-table="geometry"]') !== this.root
      )
        continue;
      const element = source.cloneNode(true) as HTMLElement;
      element.querySelectorAll('[data-resize-column]').forEach((control) => control.parentElement?.remove());
      for (const node of [element, ...element.querySelectorAll('*')]) {
        node.removeAttribute('id');
        node.removeAttribute('name');
        node.removeAttribute('autofocus');
      }
      const style = getComputedStyle(source);
      Object.assign(element.style, {
        position: 'static',
        transform: 'none',
        width: 'max-content',
        minWidth: '0',
        maxWidth: 'none',
        height: 'auto',
        maxHeight: 'none',
        flex: 'none',
        gridColumn: 'auto',
        font: style.font,
        letterSpacing: style.letterSpacing,
        textTransform: style.textTransform,
      });
      probe.append(element);
      clones.push({ element, columnId });
    }
    this.dirty.clear();
    try {
      return clones.map(({ element, columnId }) => ({
        columnId,
        width: element.getBoundingClientRect().width / scale,
      }));
    } finally {
      probe.replaceChildren();
    }
  }
}
