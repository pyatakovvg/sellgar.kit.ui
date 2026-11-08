const translation = (offset: number): string => `translateX(calc(var(--numbers-1) * ${-offset}))`;

/** Keeps the portalled center on the native scroll timeline, outside React's render cycle. */
export class HeaderScroll {
  private header?: HTMLElement;
  private source?: HTMLElement;
  private timeline?: ScrollTimeline;
  private readonly cells = new Map<HTMLElement, Animation | undefined>();
  private origin = NaN;
  private distance = NaN;

  sync(header: HTMLElement, source: HTMLElement, scroll: number, unitsPerCssPixel: number): void {
    if (header.parentElement?.dataset.tableHeaderPosition !== 'portal') {
      this.clear();
      return;
    }

    const distance = Math.max(0, source.scrollWidth - source.clientWidth) * unitsPerCssPixel;
    const origin = scroll - source.scrollLeft * unitsPerCssPixel;
    const native = typeof ScrollTimeline === 'function' && typeof header.animate === 'function' && distance > 0;
    if (this.header !== header || this.source !== source || native !== Boolean(this.timeline)) {
      this.clear();
      this.header = header;
      this.source = source;
      if (native) this.timeline = new ScrollTimeline({ source, axis: 'x' });
    }

    const visible = new Set(
      Array.from(header.children).filter(
        (cell): cell is HTMLElement => cell instanceof HTMLElement && cell.dataset.columnRegion === 'center',
      ),
    );
    for (const [cell, animation] of this.cells) {
      if (visible.has(cell)) continue;
      animation?.cancel();
      cell.style.removeProperty('transform');
      this.cells.delete(cell);
    }

    // Subtraction of the current scroll can produce rounding noise. It must not
    // rebuild an otherwise stationary timeline on every native scroll event.
    const changed = Math.abs(origin - this.origin) > 1e-7 || distance !== this.distance || Number.isNaN(this.origin);
    const keyframes = [{ transform: translation(origin) }, { transform: translation(origin + distance) }];
    for (const cell of visible) {
      if (this.timeline) {
        const animation = this.cells.get(cell);
        if (!animation) {
          cell.style.removeProperty('transform');
          this.cells.set(
            cell,
            cell.animate(keyframes, { timeline: this.timeline, duration: 1, fill: 'both', easing: 'linear' }),
          );
        } else if (changed) (animation.effect as KeyframeEffect).setKeyframes(keyframes);
      } else {
        cell.style.transform = translation(scroll);
        this.cells.set(cell, undefined);
      }
    }
    this.origin = origin;
    this.distance = distance;
    header.dataset.tableHeaderScroll = this.timeline ? 'native' : 'direct';
  }

  clear(): void {
    for (const [cell, animation] of this.cells) {
      animation?.cancel();
      cell.style.removeProperty('transform');
    }
    this.cells.clear();
    if (this.header) delete this.header.dataset.tableHeaderScroll;
    this.header = undefined;
    this.source = undefined;
    this.timeline = undefined;
    this.origin = NaN;
    this.distance = NaN;
  }
}
