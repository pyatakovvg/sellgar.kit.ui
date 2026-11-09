// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { TableRuntime } from '../../table-runtime';
import { TableBrowser } from '../table-browser';

const releases: (() => void)[] = [];
let frames: Map<number, FrameRequestCallback>;
let observers: { elements: Set<Element>; notify(): void }[];

beforeEach(() => {
  frames = new Map();
  observers = [];
  // jsdom has a zero-width viewport by default; handles require visible geometry.
  vi.spyOn(document.documentElement, 'clientWidth', 'get').mockReturnValue(2400);
  let sequence = 0;
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    frames.set(++sequence, callback);
    return sequence;
  });
  vi.stubGlobal('cancelAnimationFrame', (id: number) => frames.delete(id));
  vi.stubGlobal(
    'ResizeObserver',
    class {
      elements = new Set<Element>();
      constructor(readonly notify: () => void) {
        observers.push(this);
      }
      observe(element: Element) {
        this.elements.add(element);
      }
      disconnect() {
        this.elements.clear();
      }
    },
  );
});

afterEach(() => {
  releases
    .splice(0)
    .reverse()
    .forEach((release) => release());
  document.body.replaceChildren();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const box = (element: HTMLElement, width: number, height: number, scale: () => number) => {
  Object.assign(element.style, { width: `${width}px`, height: `${height}px`, boxSizing: 'border-box' });
  for (const [key, value] of Object.entries({
    clientWidth: width,
    offsetWidth: width,
    clientHeight: height,
    offsetHeight: height,
    clientLeft: 0,
    clientTop: 0,
  }))
    Object.defineProperty(element, key, { configurable: true, get: () => value });
  vi.spyOn(element, 'getBoundingClientRect').mockImplementation(() =>
    DOMRect.fromRect({ x: 0, y: 0, width: width * scale(), height: height * scale() }),
  );
};

const fixture = (internal = true, initialScale = 2) => {
  const geometry = { scale: initialScale };
  const owner = document.createElement('div');
  const root = document.createElement('div');
  const scroller = document.createElement('div');
  const surface = document.createElement('div');
  const probe = document.createElement('div');
  owner.append(root);
  root.append(scroller, probe);
  scroller.append(surface);
  document.body.append(owner);
  owner.style.overflowY = 'auto';
  scroller.style.overflowX = 'auto';
  scroller.style.overflowY = internal ? 'auto' : 'hidden';
  box(owner, 600, 400, () => 1);
  for (const element of [root, scroller, surface]) box(element, 600, 400, () => geometry.scale);
  box(probe, 100, 0, () => geometry.scale);
  const ownerScroll = vi.fn();
  const internalScroll = vi.fn();
  owner.scrollBy = ownerScroll;
  scroller.scrollBy = internalScroll;
  root.setPointerCapture = vi.fn();
  root.releasePointerCapture = vi.fn();
  root.hasPointerCapture = () => true;
  const runtime = new TableRuntime();
  runtime.configure(
    [
      { id: 'fixed', mode: 'fixed', width: 200, floor: 0, max: Infinity, resizable: true },
      { id: 'auto', mode: 'auto', width: 0, floor: 0, max: Infinity },
    ],
    ['row'],
    [],
    { rowHeight: 40, minRowHeight: 40, overscan: 0, virtual: true, sticky: true },
  );
  const browser = new TableBrowser(runtime);
  releases.push(browser.attach(root, surface, probe, scroller, internal));
  return { browser, runtime, geometry, root, surface, probe, scroller, ownerScroll, internalScroll };
};

describe('Table browser coordinate spaces', () => {
  it('resets only its own resize control on native double click', () => {
    const { browser, runtime, root, surface } = fixture();
    root.dataset.table = 'geometry';
    browser.resizeBy('fixed', 60);
    const handle = document.createElement('button');
    handle.dataset.resizeColumn = 'fixed';
    surface.append(handle);
    handle.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    expect(runtime.getSnapshot().widths[0]).toBe(200);
    browser.resizeBy('fixed', 60);
    const nested = document.createElement('div');
    nested.dataset.table = 'geometry';
    surface.append(nested);
    nested.append(handle);
    handle.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    expect(runtime.getSnapshot().widths[0]).toBe(260);
  });

  it('finds the handle under a double click retargeted to root by pointer capture', () => {
    const { browser, runtime, root, surface } = fixture();
    root.dataset.table = 'geometry';
    browser.resizeBy('fixed', 60);
    const handle = document.createElement('button');
    handle.dataset.resizeColumn = 'fixed';
    surface.append(handle);
    const previous = Object.getOwnPropertyDescriptor(document, 'elementFromPoint');
    Object.defineProperty(document, 'elementFromPoint', { configurable: true, value: () => handle });
    try {
      root.dispatchEvent(new MouseEvent('dblclick', { bubbles: true, clientX: 100, clientY: 20 }));
      expect(runtime.getSnapshot().widths[0]).toBe(200);
    } finally {
      if (previous) Object.defineProperty(document, 'elementFromPoint', previous);
      else Reflect.deleteProperty(document, 'elementFromPoint');
    }
  });

  it.each([true, false])('uses the actual last-row intersection owner when internal=%s', (internal) => {
    const { browser, root, scroller } = fixture(internal);
    let options: IntersectionObserverInit | undefined;
    const disconnect = vi.fn();
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        observe = vi.fn();
        disconnect = disconnect;
        constructor(_callback: IntersectionObserverCallback, input?: IntersectionObserverInit) {
          options = input;
        }
      },
    );
    browser.observeLastRow(document.createElement('div'), 'row', vi.fn(), { rootMargin: 60 });
    expect(options?.root).toBe(internal ? scroller : root.parentElement);
    releases.pop()?.();
    expect(disconnect).toHaveBeenCalledTimes(1);
  });

  it('reveals focused center controls behind pins without scrolling pins or nested tables', () => {
    vi.spyOn(document.documentElement, 'clientWidth', 'get').mockReturnValue(1200);
    const { browser, runtime, root, surface, internalScroll } = fixture();
    root.dataset.table = 'geometry';
    runtime.configure(
      [
        { id: 'left', mode: 'fixed', width: 100, floor: 0, max: Infinity, pin: 'left' },
        { id: 'center', mode: 'auto', width: 0, floor: 0, max: Infinity },
        { id: 'right', mode: 'fixed', width: 100, floor: 0, max: Infinity, pin: 'right' },
      ],
      ['row'],
      [],
      { rowHeight: 40, minRowHeight: 40, overscan: 0, virtual: true, sticky: true, pinning: { reserve: 50 } },
    );
    browser.refresh();
    expect(runtime.getSnapshot().pinning?.status).toBe('active');
    expect(runtime.getSnapshot().regions?.center.start).toBe(100);
    const cell = document.createElement('div');
    cell.dataset.columnId = 'center';
    cell.dataset.columnRegion = 'center';
    const button = document.createElement('button');
    cell.append(button);
    surface.append(cell);
    const bounds = vi.spyOn(button, 'getBoundingClientRect');
    bounds.mockReturnValue(DOMRect.fromRect({ x: 180, width: 40 }));
    button.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    expect(internalScroll).toHaveBeenLastCalledWith({ left: -10 });
    bounds.mockReturnValue(DOMRect.fromRect({ x: 1020, width: 40 }));
    button.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    expect(internalScroll).toHaveBeenLastCalledWith({ left: 30 });
    internalScroll.mockClear();
    cell.dataset.columnRegion = 'right';
    button.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    cell.dataset.columnRegion = 'center';
    cell.dataset.table = 'geometry';
    button.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    expect(internalScroll).not.toHaveBeenCalled();
  });

  it('converts logical corrections to CSS units of an internal transformed owner', () => {
    const { browser, internalScroll } = fixture();
    browser.correctScroll(40);
    expect(internalScroll).toHaveBeenCalledWith({ top: 40, behavior: 'instant' });
  });

  it('retains screen compensation for an external owner outside the transform', () => {
    const { browser, ownerScroll } = fixture(false);
    browser.correctScroll(40);
    expect(ownerScroll).toHaveBeenCalledWith({ top: 80, behavior: 'instant' });
  });

  it('keeps the numbers token unit separate from the CSS transform scale', () => {
    const { browser, runtime, geometry, probe, internalScroll } = fixture();
    // The --numbers-100 probe resolves to 200 CSS px at this theme scale.
    box(probe, 200, 0, () => geometry.scale);
    browser.refresh();
    expect(runtime.getSnapshot()).toMatchObject({
      widths: [200, 100],
      viewport: { container: 300, scale: 4, scaleY: 4 },
    });
    browser.correctScroll(40);
    expect(internalScroll).toHaveBeenCalledWith({ top: 80, behavior: 'instant' });
  });

  it('measures content and borders in a common coordinate system', () => {
    const { browser, runtime, surface, geometry } = fixture();
    const cell = document.createElement('div');
    const content = document.createElement('div');
    cell.append(content);
    surface.append(cell);
    box(cell, 200, 61, () => geometry.scale);
    cell.style.borderTop = '1px solid black';
    box(content, 200, 60, () => geometry.scale);
    releases.push(browser.observeCell(content, 'row', 'fixed'));
    observers.find((observer) => observer.elements.has(content))!.notify();
    const pending = [...frames.entries()];
    pending.forEach(([id, callback]) => {
      frames.delete(id);
      callback(0);
    });
    expect(runtime.getSnapshot().rows[0].height).toBe(61);
  });

  it('keeps a captured width at zero screen delta after scale changes, then continues and cancels', () => {
    const { browser, runtime, geometry, root, surface } = fixture();
    const header = document.createElement('div');
    surface.append(header);
    box(header, 600, 28, () => geometry.scale);
    releases.push(browser.attachHeader(header));
    const down = new MouseEvent('pointerdown', { clientX: 400, button: 0 });
    Object.defineProperties(down, { isPrimary: { value: true }, pointerId: { value: 1 } });
    browser.beginResize('fixed', down as PointerEvent);
    geometry.scale = 4;
    browser.refresh();
    const move = (clientX: number) => {
      const event = new MouseEvent('pointermove', { clientX, buttons: 1 });
      Object.defineProperty(event, 'pointerId', { value: 1 });
      root.dispatchEvent(event);
    };
    move(400);
    expect(runtime.getSnapshot()).toMatchObject({ dragging: true, widths: [200, 400] });
    move(440);
    expect(runtime.getSnapshot().widths).toEqual([210, 390]);
    root.dispatchEvent(Object.defineProperty(new Event('pointercancel'), 'pointerId', { value: 1 }));
    expect(runtime.getSnapshot()).toMatchObject({ dragging: false, widths: [200, 400] });
  });

  it.each(['left', 'right'] as const)(
    'routes the %s pin handle through mirrored resize, ignoring shared horizontal scroll during capture',
    (side) => {
      vi.spyOn(document.documentElement, 'clientWidth', 'get').mockReturnValue(1200);
      const { browser, runtime, root, surface, scroller } = fixture(true, 1);
      runtime.configure(
        [
          { id: 'left', mode: 'fixed', width: 100, floor: 50, max: Infinity, resizable: true, pin: 'left' },
          { id: 'auto', mode: 'auto', width: 0, floor: 0, max: Infinity },
          { id: 'right', mode: 'fixed', width: 100, floor: 50, max: Infinity, resizable: true, pin: 'right' },
        ],
        ['row'],
        [],
        { rowHeight: 40, minRowHeight: 40, overscan: 0, virtual: true, sticky: true, pinning: { reserve: 50 } },
      );
      const header = document.createElement('div');
      surface.append(header);
      box(header, 600, 28, () => 1);
      releases.push(browser.attachHeader(header));
      vi.mocked(surface.getBoundingClientRect).mockImplementation(() =>
        DOMRect.fromRect({ x: -scroller.scrollLeft, width: 600, height: 400 }),
      );
      const start = side === 'left' ? 100 : 500;
      const sign = side === 'left' ? 1 : -1;
      const down = new MouseEvent('pointerdown', { clientX: start, button: 0 });
      Object.defineProperties(down, { isPrimary: { value: true }, pointerId: { value: 9 } });
      browser.beginResize(side, down as PointerEvent);
      expect(runtime.getSnapshot().dragging).toBe(true);
      expect(root.setPointerCapture).toHaveBeenCalledWith(9);
      const move = (width: number) => {
        const event = new MouseEvent('pointermove', { clientX: start + sign * (width - 100), buttons: 1 });
        Object.defineProperty(event, 'pointerId', { value: 9 });
        root.dispatchEvent(event);
      };
      const activeWidth = () => runtime.getSnapshot().columns.find((column) => column.id === side)!.width;
      move(200);
      expect(activeWidth()).toBe(200);
      scroller.scrollLeft = 120;
      browser.refresh();
      move(200);
      expect(activeWidth()).toBe(200);
      for (const [request, width] of [
        [-200, 50],
        [-150, 50],
        [50, 50],
        [80, 80],
        [200, 200],
        [1000, 450],
        [800, 450],
        [400, 400],
      ]) {
        move(request);
        expect(activeWidth()).toBe(width);
      }
      const opposite = side === 'left' ? 'right' : 'left';
      expect(runtime.getSnapshot().columns.find((column) => column.id === opposite)!.width).toBe(100);
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      expect(runtime.getSnapshot().dragging).toBe(false);
      expect(activeWidth()).toBe(100);
      browser.resizeBy(side, sign * 10);
      expect(activeWidth()).toBe(110);
      browser.resizeBy(side, -sign * 10);
      expect(activeWidth()).toBe(100);
    },
  );

  it('rebases a captured right pin on scale changes and commits pointerup without losing its initial cancel snapshot', () => {
    vi.spyOn(document.documentElement, 'clientWidth', 'get').mockReturnValue(2400);
    const { browser, runtime, geometry, root, surface } = fixture(true, 1);
    runtime.configure(
      [
        { id: 'auto', mode: 'auto', width: 0, floor: 50, max: Infinity },
        { id: 'right', mode: 'fixed', width: 100, floor: 50, max: Infinity, resizable: true, pin: 'right' },
      ],
      ['row'],
      [],
      { rowHeight: 40, minRowHeight: 40, overscan: 0, virtual: true, sticky: true, pinning: { reserve: 50 } },
    );
    const header = document.createElement('div');
    surface.append(header);
    box(header, 600, 28, () => geometry.scale);
    releases.push(browser.attachHeader(header));
    const down = new MouseEvent('pointerdown', { clientX: 500, button: 0 });
    Object.defineProperties(down, { isPrimary: { value: true }, pointerId: { value: 7 } });
    browser.beginResize('right', down as PointerEvent);
    const move = (clientX: number) => {
      const event = new MouseEvent('pointermove', { clientX, buttons: 1 });
      Object.defineProperty(event, 'pointerId', { value: 7 });
      root.dispatchEvent(event);
    };
    move(400);
    expect(runtime.getSnapshot().columns.at(-1)!.width).toBe(200);
    geometry.scale = 2;
    browser.refresh();
    move(400);
    expect(runtime.getSnapshot().columns.at(-1)!.width).toBe(200);
    move(380);
    expect(runtime.getSnapshot().columns.at(-1)!.width).toBe(210);
    root.dispatchEvent(Object.defineProperty(new Event('pointerup'), 'pointerId', { value: 7 }));
    expect(runtime.getSnapshot().dragging).toBe(false);
    expect(runtime.getSnapshot().columns.at(-1)!.width).toBe(210);
  });
});
