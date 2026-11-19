interface LastRowOptions {
  readonly rootMargin?: number;
  readonly threshold?: number;
}

/** Наблюдает видимость строки по вертикали и сохраняет видимость через виртуальные перемонтирования. */
export class LastRowObserver {
  private release?: () => void;
  private refreshTarget?: () => void;
  private targetId?: string;
  private visible = false;

  observe(
    element: HTMLElement,
    id: string,
    root: HTMLElement | null,
    onVisible: () => void,
    options: LastRowOptions,
  ): () => void {
    if (options.rootMargin !== undefined && !Number.isFinite(options.rootMargin))
      throw new RangeError('Table lastRowTrigger.rootMargin must be finite.');
    if (
      options.threshold !== undefined &&
      (!Number.isFinite(options.threshold) || options.threshold < 0 || options.threshold > 1)
    )
      throw new RangeError('Table lastRowTrigger.threshold must be between 0 and 1.');
    this.release?.();
    if (this.targetId !== id) this.visible = false;
    this.targetId = id;
    if (typeof IntersectionObserver === 'undefined') return () => {};
    let active = true;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!active || entry.target !== element) continue;
          const visible =
            entry.isIntersecting &&
            entry.boundingClientRect.height > 0 &&
            entry.intersectionRect.height / entry.boundingClientRect.height >= (options.threshold ?? 0);
          const entered = visible && !this.visible;
          this.visible = visible;
          if (entered) onVisible();
        }
      },
      {
        root,
        rootMargin: `0px 0px ${options.rootMargin ?? Math.ceil(element.getBoundingClientRect().height)}px 0px`,
        threshold: 0,
      },
    );
    observer.observe(element);
    this.refreshTarget = () => {
      if (!active) return;
      // IO threshold считает площадь: при горизонтальном clipping он не отражает
      // долю высоты строки. Native scroll/resize запрашивает свежую запись IO.
      observer.unobserve(element);
      observer.observe(element);
    };
    const release = () => {
      active = false;
      observer.disconnect();
      if (this.release === release) {
        this.release = undefined;
        this.refreshTarget = undefined;
      }
    };
    this.release = release;
    return release;
  }

  refresh(renderedRows?: readonly { readonly id: string }[]): void {
    if (renderedRows && !renderedRows.some((row) => row.id === this.targetId)) this.visible = false;
    this.refreshTarget?.();
  }

  clear(): void {
    this.release?.();
    this.targetId = undefined;
    this.visible = false;
  }
}
