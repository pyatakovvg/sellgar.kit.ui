interface PositionWatch {
  readonly element: HTMLElement;
  readonly changed: () => void;
  rect: string;
}

const watches = new Set<PositionWatch>();
let frame = 0;

const sample = (): void => {
  const changed: (() => void)[] = [];
  for (const watch of watches) {
    const { x, y, width, height } = watch.element.getBoundingClientRect();
    const rect = `${x}:${y}:${width}:${height}`;
    if (rect === watch.rect) continue;
    watch.rect = rect;
    changed.push(watch.changed);
  }
  changed.forEach((notify) => notify());
  frame = watches.size ? requestAnimationFrame(sample) : 0;
};

// ResizeObserver does not report movement caused by siblings or CSS transforms.
// One shared frame reads positions; unchanged tables do not publish snapshots.
export const observePosition = (element: HTMLElement, changed: () => void): (() => void) => {
  const watch = { element, changed, rect: '' };
  watches.add(watch);
  if (!frame) frame = requestAnimationFrame(sample);
  return () => {
    watches.delete(watch);
    if (!watches.size && frame) {
      cancelAnimationFrame(frame);
      frame = 0;
    }
  };
};
