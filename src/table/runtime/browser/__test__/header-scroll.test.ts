// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { HeaderScroll } from '../header-scroll';

afterEach(() => {
  vi.unstubAllGlobals();
  document.body.replaceChildren();
});

const fixture = () => {
  const layer = document.createElement('div');
  layer.dataset.tableHeaderPosition = 'portal';
  const header = document.createElement('div');
  const source = document.createElement('div');
  layer.append(header);
  document.body.append(source, layer);
  const cells = ['left', 'center', 'center', 'right'].map((region) => {
    const cell = document.createElement('div');
    cell.dataset.columnRegion = region;
    header.append(cell);
    return cell;
  });
  const size = { width: 600, total: 1000 };
  Object.defineProperties(source, {
    clientWidth: { get: () => size.width },
    scrollWidth: { get: () => size.total },
  });
  const bindings: {
    cell: HTMLElement;
    effect: { setKeyframes: ReturnType<typeof vi.fn> };
    cancel: ReturnType<typeof vi.fn>;
  }[] = [];
  const animate = vi.fn(function (this: HTMLElement, _keyframes: Keyframe[], _options: KeyframeAnimationOptions) {
    const binding = { cell: this, effect: { setKeyframes: vi.fn() }, cancel: vi.fn() };
    bindings.push(binding);
    return binding;
  });
  for (const cell of [header, ...cells]) cell.animate = animate as unknown as HTMLElement['animate'];
  const sync = new HeaderScroll();
  return { sync, source, layer, header, cells, size, animate, bindings };
};

const nativeTimeline = () => {
  const constructors = vi.fn();
  vi.stubGlobal(
    'ScrollTimeline',
    class {
      constructor(options: ScrollTimelineOptions) {
        constructors(options);
      }
    },
  );
  return constructors;
};

describe('Portalled header horizontal scroll', () => {
  it('binds only center cells to the actual source, preserving progress through direction reversals', () => {
    const constructors = nativeTimeline();
    const { sync, source, header, cells, animate, bindings } = fixture();
    source.scrollLeft = 200;
    sync.sync(header, source, 100, 0.5);
    expect(constructors).toHaveBeenCalledWith({ source, axis: 'x' });
    expect(bindings.map(({ cell }) => cell)).toEqual(cells.slice(1, 3));
    expect(animate.mock.calls[0][0]).toEqual([
      { transform: 'translateX(calc(var(--numbers-1) * 0))' },
      { transform: 'translateX(calc(var(--numbers-1) * -200))' },
    ]);
    for (const scroll of [400, 100, 300, 0]) {
      source.scrollLeft = scroll;
      sync.sync(header, source, scroll * 0.5 + 1e-10, 0.5);
    }
    expect(constructors).toHaveBeenCalledTimes(1);
    expect(animate).toHaveBeenCalledTimes(2);
    for (const binding of bindings) {
      expect(binding.effect.setKeyframes).not.toHaveBeenCalled();
      expect(binding.cancel).not.toHaveBeenCalled();
      expect(binding.cell.style.transform).toBe('');
    }
    expect(header.dataset.tableHeaderScroll).toBe('native');
    sync.clear();
  });

  it('updates range and a stable table inset, then releases virtualized cells and flow placement', () => {
    nativeTimeline();
    const { sync, source, layer, header, cells, size, bindings } = fixture();
    sync.sync(header, source, -20, 1);
    size.total = 1200;
    sync.sync(header, source, -20, 1);
    expect(bindings[0].effect.setKeyframes).toHaveBeenLastCalledWith([
      { transform: 'translateX(calc(var(--numbers-1) * 20))' },
      { transform: 'translateX(calc(var(--numbers-1) * -580))' },
    ]);
    cells[1].remove();
    sync.sync(header, source, -20, 1);
    expect(bindings[0].cancel).toHaveBeenCalledTimes(1);
    expect(bindings[1].cancel).not.toHaveBeenCalled();
    layer.dataset.tableHeaderPosition = 'flow';
    sync.sync(header, source, -20, 1);
    expect(bindings[1].cancel).toHaveBeenCalledTimes(1);
    expect(header.dataset.tableHeaderScroll).toBeUndefined();
    sync.clear();
    expect(bindings[1].cancel).toHaveBeenCalledTimes(1);
  });

  it('rebinds a changed owner and removes all effects on teardown', () => {
    const constructors = nativeTimeline();
    const { sync, source, header, bindings } = fixture();
    sync.sync(header, source, 0, 1);
    const other = source.cloneNode() as HTMLElement;
    Object.defineProperties(other, { clientWidth: { value: 500 }, scrollWidth: { value: 900 } });
    sync.sync(header, other, 0, 1);
    expect(constructors).toHaveBeenLastCalledWith({ source: other, axis: 'x' });
    expect(bindings[0].cancel).toHaveBeenCalledTimes(1);
    expect(bindings[1].cancel).toHaveBeenCalledTimes(1);
    sync.clear();
    expect(bindings.every((binding) => binding.cancel.mock.calls.length === 1)).toBe(true);
  });

  it('uses direct numbers-based positioning without native support and clears it on return to flow', () => {
    vi.stubGlobal('ScrollTimeline', undefined);
    const { sync, source, header, cells, layer, animate } = fixture();
    sync.sync(header, source, 130.5, 0.5);
    expect(cells[1].style.transform).toBe('translateX(calc(var(--numbers-1) * -130.5))');
    sync.sync(header, source, 0, 0.5);
    expect(cells[1].style.transform).toBe('translateX(calc(var(--numbers-1) * 0))');
    expect(cells[0].style.transform).toBe('');
    expect(cells[3].style.transform).toBe('');
    expect(animate).not.toHaveBeenCalled();
    layer.dataset.tableHeaderPosition = 'flow';
    sync.sync(header, source, 0, 0.5);
    expect(cells[1].style.transform).toBe('');
  });

  it('does not attach an inactive timeline when horizontal overflow disappears', () => {
    const constructors = nativeTimeline();
    const { sync, source, header, size, bindings } = fixture();
    sync.sync(header, source, 0, 1);
    size.total = size.width;
    sync.sync(header, source, 0, 1);
    expect(constructors).toHaveBeenCalledTimes(1);
    expect(bindings.every((binding) => binding.cancel.mock.calls.length === 1)).toBe(true);
    expect(header.dataset.tableHeaderScroll).toBe('direct');
    sync.clear();
  });
});
