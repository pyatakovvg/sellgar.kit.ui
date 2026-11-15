// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ContentWidths } from '../content-widths';

const releases: (() => void)[] = [];
beforeEach(() => {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
    const width = Number(this.getAttribute('data-intrinsic') ?? 0);
    return { x: 0, y: 0, left: 0, right: width, top: 0, bottom: 20, width, height: 20, toJSON: () => ({}) };
  });
});
afterEach(() => {
  releases
    .splice(0)
    .reverse()
    .forEach((release) => release());
  document.body.replaceChildren();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
const setup = () => {
  const root = document.createElement('div');
  root.setAttribute('data-table', 'geometry');
  document.body.append(root);
  const schedule = vi.fn();
  const widths = new ContentWidths(schedule);
  releases.push(widths.attach(root));
  return { root, schedule, widths };
};
const source = (root: HTMLElement, width: number) => {
  const element = document.createElement('div');
  element.setAttribute('data-intrinsic', String(width));
  element.textContent = '8 900 ₽';
  root.append(element);
  return element;
};

describe('Mounted content width reader', () => {
  it('skips columns with explicit minima before cloning or measuring', () => {
    const { root, widths } = setup();
    const element = source(root, 240);
    widths.observe(element, 'price');
    const clone = vi.spyOn(element, 'cloneNode');
    expect(widths.measure(1, 1, new Set())).toEqual([]);
    expect(clone).not.toHaveBeenCalled();
    expect(widths.measure(2, 1, new Set(['price']))).toEqual([{ columnId: 'price', width: 240 }]);
  });

  it('normalizes screen pixels and cleans all hidden clones after a batch', () => {
    const { root, widths } = setup();
    const first = source(root, 180);
    const second = source(root, 200);
    widths.observe(first, 'price');
    widths.observe(second, 'price');
    expect(widths.measure(1, 2, new Set(['price']))).toEqual([
      { columnId: 'price', width: 90 },
      { columnId: 'price', width: 100 },
    ]);
    const probe = root.querySelector('[data-table-content-probe]')!;
    expect(probe.childNodes).toHaveLength(0);
    expect(probe.getAttribute('aria-hidden')).toBe('true');
  });

  it('preserves menu size, excludes the resize handle, and never duplicates live IDs', () => {
    const { root, widths } = setup();
    const header = source(root, 180);
    header.innerHTML =
      '<span id="caption">Цена</span><div data-table-header-control="true">Меню</div><div data-table-header-control="true"><button data-resize-column="price"></button></div>';
    widths.observe(header, 'price');
    const read = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
      this: HTMLElement,
    ) {
      if (this.parentElement?.hasAttribute('data-table-content-probe')) {
        expect(this.querySelector('#caption')).toBeNull();
        expect(this.querySelector('[data-resize-column]')).toBeNull();
        expect(this.querySelector('[data-table-header-control]')?.textContent).toBe('Меню');
        expect(document.querySelectorAll('#caption')).toHaveLength(1);
      }
      return { width: 180 } as DOMRect;
    });
    widths.measure(1, 1, new Set(['price']));
    expect(read).toHaveBeenCalled();
  });

  it('ignores its own clone mutations and image loads but invalidates changed source text', async () => {
    const { root, widths, schedule } = setup();
    const element = source(root, 180);
    widths.observe(element, 'price');
    await Promise.resolve();
    schedule.mockClear();
    widths.measure(1, 1, new Set(['price']));
    root.querySelector('[data-table-content-probe]')!.dispatchEvent(new Event('load'));
    await Promise.resolve();
    expect(schedule).not.toHaveBeenCalled();
    element.firstChild!.textContent = '120 000 ₽';
    await Promise.resolve();
    expect(schedule).toHaveBeenCalled();
    expect(widths.measure(1, 1, new Set(['price']))).toHaveLength(1);
  });

  it('does not measure detached or released virtual cells', () => {
    const { root, widths } = setup();
    const element = source(root, 180);
    const release = widths.observe(element, 'price');
    element.remove();
    expect(widths.measure(1, 1, new Set(['price']))).toEqual([]);
    root.append(element);
    release();
    expect(widths.measure(2, 1, new Set(['price']))).toEqual([]);
  });
  it('measures newly mounted cells without invalidating unchanged siblings', async () => {
    const { root, widths } = setup();
    const first = source(root, 180);
    widths.observe(first, 'first');
    await Promise.resolve();
    widths.measure(1, 1, new Set(['first', 'second']));
    const clone = vi.spyOn(first, 'cloneNode');
    const second = source(root, 200);
    widths.observe(second, 'second');
    await Promise.resolve();
    expect(widths.measure(1, 1, new Set(['first', 'second']))).toEqual([{ columnId: 'second', width: 200 }]);
    expect(clone).not.toHaveBeenCalled();
    first.firstChild!.textContent = 'Changed content';
    await Promise.resolve();
    expect(widths.measure(1, 1, new Set(['first', 'second']))).toEqual([{ columnId: 'first', width: 180 }]);
    expect(clone).toHaveBeenCalledTimes(1);
  });

  it('invalidates only the source of a loaded image and remeasures all on an epoch change', async () => {
    const { root, widths } = setup();
    const first = source(root, 180);
    const second = source(root, 200);
    const image = document.createElement('img');
    first.append(image);
    widths.observe(first, 'first');
    widths.observe(second, 'second');
    await Promise.resolve();
    const columns = new Set(['first', 'second']);
    widths.measure(1, 1, columns);
    image.dispatchEvent(new Event('load'));
    expect(widths.measure(1, 1, columns)).toEqual([{ columnId: 'first', width: 180 }]);
    expect(widths.measure(2, 1, columns)).toHaveLength(2);
  });
});
