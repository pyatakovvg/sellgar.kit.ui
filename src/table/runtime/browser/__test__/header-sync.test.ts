// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { TableRuntime } from '../../table-runtime';
import { TableBrowser } from '../table-browser';

const releases: (() => void)[] = [];

beforeEach(() => {
  vi.stubGlobal('requestAnimationFrame', () => 1);
  vi.stubGlobal('cancelAnimationFrame', () => {});
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      disconnect() {}
    },
  );
  vi.stubGlobal('ScrollTimeline', undefined);
  vi.spyOn(document.documentElement, 'clientWidth', 'get').mockReturnValue(2400);
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

const fixture = () => {
  const root = document.createElement('div');
  const source = document.createElement('div');
  const surface = document.createElement('div');
  const probe = document.createElement('div');
  const layer = document.createElement('div');
  const header = document.createElement('div');
  const cell = document.createElement('div');
  root.append(source, probe, layer);
  source.append(surface);
  layer.append(header);
  header.append(cell);
  document.body.append(root);
  layer.dataset.tableHeaderPosition = 'portal';
  cell.dataset.columnRegion = 'center';
  source.style.overflowX = 'auto';
  source.style.overflowY = 'auto';
  let sourceScale = 1;
  const sizes = (element: HTMLElement, width: number, height: number, scale = () => 1) => {
    Object.assign(element.style, { width: `${width}px`, height: `${height}px`, boxSizing: 'border-box' });
    for (const [key, value] of Object.entries({
      clientWidth: width,
      offsetWidth: width,
      clientHeight: height,
      offsetHeight: height,
      clientTop: 0,
      clientLeft: 0,
    }))
      Object.defineProperty(element, key, { configurable: true, get: () => value });
    vi.spyOn(element, 'getBoundingClientRect').mockImplementation(() =>
      DOMRect.fromRect({
        x: element === surface ? -source.scrollLeft * sourceScale : 0,
        width: width * scale(),
        height: height * scale(),
      }),
    );
  };
  sizes(root, 600, 400);
  sizes(source, 600, 400, () => sourceScale);
  sizes(surface, 1000, 800, () => sourceScale);
  sizes(probe, 100, 0);
  sizes(header, 1000, 28);
  const range = vi.fn(() => 1000);
  Object.defineProperty(source, 'scrollWidth', { configurable: true, get: range });
  source.scrollBy = vi.fn();
  const runtime = new TableRuntime();
  runtime.configure(
    [
      { id: 'wide', mode: 'fixed', width: 800, floor: 100, max: Infinity },
      { id: 'auto', mode: 'auto', width: 0, floor: 200, max: Infinity },
    ],
    Array.from({ length: 50 }, (_, i) => String(i)),
    [],
    { rowHeight: 40, minRowHeight: 40, overscan: 0, virtual: true, sticky: true },
  );
  const browser = new TableBrowser(runtime);
  releases.push(browser.attach(root, surface, probe, source, true));
  releases.push(browser.attachHeader(header));
  return {
    root,
    source,
    surface,
    layer,
    header,
    cell,
    range,
    runtime,
    browser,
    setSourceScale: (value: number) => {
      sourceScale = value;
    },
  };
};

describe('Header horizontal synchronization', () => {
  it('does not reread the horizontal scroll range for vertical viewport and row changes', () => {
    const { browser, runtime, range, cell } = fixture();
    range.mockClear();
    for (let i = 1; i <= 20; i++) {
      runtime.updateViewport({ ...runtime.getSnapshot().viewport, scroll: i * 40 });
      browser.present();
      browser.syncHeaderScroll();
    }
    expect(range).not.toHaveBeenCalled();
    expect(cell.style.transform).toBe('translateX(calc(var(--numbers-1) * 0))');
  });

  it('keeps direct horizontal scrolling live without ScrollTimeline', () => {
    const { browser, source, range, cell } = fixture();
    range.mockClear();
    source.scrollLeft = 40;
    browser.refresh();
    expect(cell.style.transform).toBe('translateX(calc(var(--numbers-1) * -40))');
    expect(range).toHaveBeenCalled();
  });

  it('refreshes the native source origin even when a moving surface keeps the logical offset unchanged', () => {
    const { browser, source, surface, range } = fixture();
    vi.mocked(surface.getBoundingClientRect).mockImplementation(() => DOMRect.fromRect({ width: 1000, height: 800 }));
    range.mockClear();
    source.scrollLeft = 40;
    browser.refresh();
    expect(range).toHaveBeenCalled();
  });

  it('synchronizes replacement cells and clears cells that become pinned', () => {
    const { browser, source, header, cell } = fixture();
    source.scrollLeft = 40;
    browser.refresh();
    const replacement = document.createElement('div');
    replacement.dataset.columnRegion = 'center';
    header.replaceChild(replacement, cell);
    browser.syncHeaderScroll();
    expect(cell.style.transform).toBe('');
    expect(replacement.style.transform).toBe('translateX(calc(var(--numbers-1) * -40))');
    replacement.dataset.columnRegion = 'left';
    browser.syncHeaderScroll();
    expect(replacement.style.transform).toBe('');
  });

  it('clears floating transforms in flow and restores them after pinning the header again', () => {
    const { browser, source, layer, cell } = fixture();
    source.scrollLeft = 40;
    browser.refresh();
    layer.dataset.tableHeaderPosition = 'flow';
    browser.syncHeaderScroll();
    expect(cell.style.transform).toBe('');
    layer.dataset.tableHeaderPosition = 'portal';
    browser.syncHeaderScroll();
    expect(cell.style.transform).toBe('translateX(calc(var(--numbers-1) * -40))');
  });

  it('uses freshly measured source scale when the scroll viewport is transformed', () => {
    const { browser, source, cell, setSourceScale } = fixture();
    source.scrollLeft = 40;
    browser.refresh();
    setSourceScale(2);
    browser.refresh();
    expect(cell.style.transform).toBe('translateX(calc(var(--numbers-1) * -80))');
  });
});
