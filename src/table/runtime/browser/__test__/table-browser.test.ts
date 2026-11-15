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
  it.each([false, true])(
    'draws a header top border only after the parent clips the table outline (internal: %s)',
    (internal) => {
      const { root, scroller, surface, browser } = fixture(internal);
      const layer = document.createElement('div');
      const header = document.createElement('div');
      layer.dataset.tableHeaderPosition = 'portal';
      layer.append(header);
      root.append(layer);
      releases.push(browser.attachHeader(header));
      expect(layer.dataset.tableHeaderTopBorder).toBe('false');
      let top = -40;
      vi.mocked(surface.getBoundingClientRect).mockImplementation(() =>
        DOMRect.fromRect({ x: 0, y: top, width: 1200, height: 800 }),
      );
      vi.mocked(scroller.getBoundingClientRect).mockImplementation(() =>
        DOMRect.fromRect({ x: 0, y: internal ? 0 : top, width: 1200, height: 800 }),
      );
      browser.refresh();
      expect(layer.dataset.tableHeaderTopBorder).toBe(String(!internal));
      top = 0;
      browser.refresh();
      expect(layer.dataset.tableHeaderTopBorder).toBe('false');
    },
  );

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

describe('Manual column resize notifications', () => {
  const setup = (internal = true, scale = 2) => {
    const context = fixture(internal, scale);
    const header = document.createElement('div');
    context.surface.append(header);
    box(header, 600, 28, () => context.geometry.scale);
    releases.push(context.browser.attachHeader(header));
    const handler = vi.fn();
    context.browser.setResizeHandler(handler);
    const down = (column = 'fixed', clientX = 400) => {
      const event = new MouseEvent('pointerdown', { clientX, button: 0 });
      Object.defineProperties(event, { isPrimary: { value: true }, pointerId: { value: 1 } });
      context.browser.beginResize(column, event as PointerEvent);
    };
    const pointer = (type: string, clientX = 400, buttons = 1, id = 1) => {
      const event = new MouseEvent(type, { clientX, buttons });
      Object.defineProperty(event, 'pointerId', { value: id });
      context.root.dispatchEvent(event);
    };
    return { ...context, header, handler, down, pointer };
  };

  it.each([true, false])('notifies once on pointerup in logical units, internal=%s', (internal) => {
    const { runtime, handler, down, pointer, root } = setup(internal);
    down();
    pointer('pointermove', 440);
    pointer('pointermove', 480);
    expect(handler).not.toHaveBeenCalled();
    pointer('pointerup', 480);
    expect(handler.mock.calls).toEqual([['fixed', 240]]);
    expect(runtime.getSnapshot().dragging).toBe(false);
    expect(root.releasePointerCapture).toHaveBeenCalledWith(1);
    pointer('pointerup', 480);
    pointer('lostpointercapture');
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it.each([
    [true, 1, 0],
    [true, 1, 1.75],
    [true, 1, 4],
    [false, 1, 4],
    [true, 2, 4],
    [false, 2, 4],
  ])(
    'limits a one-event overshoot and preserves the grab through reversals (internal=%s, scale=%s, offset=%s)',
    (internal, scale, offset) => {
      const { browser, runtime, root, handler, down, pointer } = setup(Boolean(internal), Number(scale));
      const factor = Number(scale);
      box(root.parentElement!, 600 * factor, 400, () => 1);
      runtime.configure(
        [
          { id: 'first', mode: 'fixed', width: 200, floor: 100, max: Infinity, resizable: true },
          { id: 'last', mode: 'fixed', width: 400, floor: 100, max: Infinity, resizable: true },
        ],
        ['row'],
        [],
        { rowHeight: 40, minRowHeight: 40, overscan: 0, virtual: true, sticky: true },
      );
      browser.refresh();
      down('last', (600 - Number(offset)) * factor);
      for (const [position, width] of [
        [1400, 400],
        [1000, 400],
        [599, 399],
        [500, 300],
        [1400, 400],
        [550, 350],
      ]) {
        pointer('pointermove', (position - Number(offset)) * factor);
        expect(runtime.getColumnWidth('last')).toBeCloseTo(width, 8);
        expect(runtime.getSnapshot().dragging).toBe(true);
        expect(handler).not.toHaveBeenCalled();
      }
      pointer('pointerup', (550 - Number(offset)) * factor);
      expect(handler.mock.calls).toEqual([['last', 350]]);
      expect(runtime.getSnapshot().dragging).toBe(false);
      expect(runtime.getSnapshot().total).toBe(600);
    },
  );

  it('applies the same right boundary to an earlier column while allowing table overflow', () => {
    const { browser, runtime, down, pointer } = setup(true, 1);
    down('fixed', 196);
    pointer('pointermove', 2000);
    expect(runtime.getColumnWidth('fixed')).toBe(600);
    expect(runtime.getSnapshot().total).toBe(600);
    pointer('pointermove', 595);
    expect(runtime.getColumnWidth('fixed')).toBe(599);
    pointer('pointerup', 595);
    expect(runtime.getSnapshot().dragging).toBe(false);
    browser.resizeBy('fixed', 1000);
    expect(runtime.getColumnWidth('fixed')).toBe(600);
  });

  it('rechecks the final edge before notifying when the viewport changes before pointerup', () => {
    const { browser, runtime, scroller, handler, down, pointer } = setup(true, 1);
    down('fixed', 200);
    pointer('pointermove', 500);
    expect(runtime.getColumnWidth('fixed')).toBe(500);
    box(scroller, 400, 400, () => 1);
    pointer('pointerup', 500);
    expect(runtime.getColumnWidth('fixed')).toBe(400);
    expect(runtime.getSnapshot().dragging).toBe(false);
    expect(handler.mock.calls).toEqual([['fixed', 400]]);
    browser.refresh();
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it.each(['pointercancel', 'lostpointercapture', 'Escape', 'blur', 'detach'])(
    'does not notify on cancellation by %s',
    (reason) => {
      const { runtime, browser, handler, down, pointer } = setup();
      down();
      pointer('pointermove', 480);
      if (reason === 'Escape') window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      else if (reason === 'blur') window.dispatchEvent(new Event('blur'));
      else if (reason === 'detach') releases.pop()!();
      else pointer(reason);
      pointer('pointerup', 480);
      expect(runtime.getColumnWidth('fixed')).toBe(200);
      expect(runtime.getSnapshot().dragging).toBe(false);
      expect(handler).not.toHaveBeenCalled();
      browser.resetColumnWidth('fixed');
      expect(handler).not.toHaveBeenCalled();
    },
  );

  it.each(['click', 'return', 'wrong-pointer'])('ignores %s without a net manual change', (action) => {
    const { handler, down, pointer } = setup();
    down();
    if (action === 'return') {
      pointer('pointermove', 480);
      pointer('pointermove', 400);
    } else if (action === 'wrong-pointer') pointer('pointermove', 480, 1, 2);
    pointer('pointerup');
    expect(handler).not.toHaveBeenCalled();
  });

  it('uses the latest handler and allows synchronous persistence without recursion', () => {
    const { runtime, browser, handler, down, pointer } = setup();
    down();
    pointer('pointermove', 480);
    const persist = vi.fn((id: string, width: number) => {
      expect(runtime.getSnapshot().dragging).toBe(false);
      runtime.configure(
        [
          { id, mode: 'fixed', width, floor: 0, max: Infinity, resizable: true },
          { id: 'auto', mode: 'auto', width: 0, floor: 0, max: Infinity },
        ],
        ['row'],
        [],
        { rowHeight: 40, minRowHeight: 40, overscan: 0, virtual: true, sticky: true },
      );
      browser.refresh();
    });
    browser.setResizeHandler(persist);
    pointer('pointerup', 480);
    expect(handler).not.toHaveBeenCalled();
    expect(persist.mock.calls).toEqual([['fixed', 240]]);
    browser.refresh();
    expect(persist).toHaveBeenCalledTimes(1);
    expect(runtime.getColumnWidth('fixed')).toBe(240);
  });

  it('does not notify on viewport, content, props, scroll or direct runtime operations', () => {
    const { runtime, browser, handler, geometry, scroller } = setup();
    runtime.configure(
      [
        { id: 'fixed', mode: 'fixed', width: 250, floor: 100, max: Infinity, measureContent: true, resizable: true },
        { id: 'auto', mode: 'auto', width: 0, floor: 0, max: Infinity },
      ],
      ['row'],
      [],
      { rowHeight: 40, minRowHeight: 40, overscan: 0, virtual: true, sticky: true },
    );
    runtime.commitContentWidths([{ columnId: 'fixed', width: 280 }], runtime.getSnapshot().contentEpoch);
    geometry.scale = 3;
    scroller.scrollLeft = 20;
    browser.refresh();
    runtime.beginResize('fixed', 0);
    runtime.moveResize(40);
    runtime.finishResize();
    expect(handler).not.toHaveBeenCalled();
  });

  it.each(['schema', 'permission'])('does not notify after %s cancels the operation', (change) => {
    const { runtime, handler, down, pointer } = setup();
    down();
    pointer('pointermove', 480);
    runtime.configure(
      [
        {
          id: 'fixed',
          mode: 'fixed',
          width: change === 'schema' ? 210 : 200,
          floor: 0,
          max: Infinity,
          resizable: change !== 'permission',
        },
        { id: 'auto', mode: 'auto', width: 0, floor: 0, max: Infinity },
      ],
      ['row'],
      [],
      { rowHeight: 40, minRowHeight: 40, overscan: 0, virtual: true, sticky: true },
    );
    pointer('pointerup', 480);
    expect(handler).not.toHaveBeenCalled();
  });

  it('commits repeated keyboard moves once on keyup, and cancels a later gesture', () => {
    const { runtime, browser, handler } = setup();
    browser.resizeByKey('fixed', 1);
    browser.resizeByKey('fixed', 1);
    browser.resizeByKey('fixed', 10);
    expect(handler).not.toHaveBeenCalled();
    expect(runtime.getColumnWidth('fixed')).toBe(212);
    browser.finishKeyResize('fixed');
    browser.finishKeyResize('fixed');
    expect(handler.mock.calls).toEqual([['fixed', 212]]);
    browser.resizeByKey('fixed', 10);
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    browser.finishKeyResize('fixed');
    expect(runtime.getColumnWidth('fixed')).toBe(212);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('suppresses unchanged keyboard gestures, forbidden columns, and competing input', () => {
    const { runtime, browser, handler, down, pointer } = setup();
    browser.resizeByKey('fixed', 10);
    browser.resizeByKey('fixed', -10);
    browser.finishKeyResize('fixed');
    browser.resizeBy('auto', 10);
    browser.resizeBy('absent', 10);
    browser.resizeBy('fixed', NaN);
    expect(handler).not.toHaveBeenCalled();
    down();
    browser.resizeBy('fixed', 80);
    browser.resetColumnWidth('fixed');
    expect(runtime.getSnapshot().dragging).toBe(true);
    pointer('pointerup');
    expect(handler).not.toHaveBeenCalled();
  });

  it('notifies once for reset, with no initial or redundant reset notification', () => {
    const { runtime, browser, handler, root, surface } = setup();
    root.dataset.table = 'geometry';
    const handle = document.createElement('button');
    handle.dataset.resizeColumn = 'fixed';
    surface.append(handle);
    const reset = () => handle.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    reset();
    expect(handler).not.toHaveBeenCalled();
    browser.resizeBy('fixed', 80);
    handler.mockClear();
    reset();
    reset();
    expect(handler.mock.calls).toEqual([['fixed', 200]]);
    expect(runtime.getColumnWidth('fixed')).toBe(200);
  });

  it('cleans up before a callback throws and can resize again without a callback', () => {
    const { runtime, browser } = setup();
    browser.setResizeHandler(() => {
      throw new Error('Storage failed');
    });
    expect(() => browser.resizeBy('fixed', 20)).toThrow('Storage failed');
    expect(runtime.getSnapshot().dragging).toBe(false);
    browser.setResizeHandler(undefined);
    browser.resizeBy('fixed', 20);
    expect(runtime.getColumnWidth('fixed')).toBe(240);
  });

  it.each(['left', 'right'] as const)('notifies only the active %s pin, including mirrored reset', (side) => {
    const { runtime, browser, handler } = setup(true, 1);
    runtime.configure(
      [
        { id: 'left', mode: 'fixed', width: 100, floor: 50, max: Infinity, resizable: true, pin: 'left' },
        { id: 'auto', mode: 'auto', width: 0, floor: 0, max: Infinity },
        { id: 'right', mode: 'fixed', width: 100, floor: 50, max: Infinity, resizable: true, pin: 'right' },
      ],
      ['row'],
      [],
      { rowHeight: 40, minRowHeight: 40, overscan: 0, virtual: true, sticky: true },
    );
    browser.resizeBy(side, side === 'left' ? 30 : -30);
    expect(handler.mock.calls).toEqual([[side, 130]]);
    browser.resetColumnWidth(side);
    expect(handler.mock.calls).toEqual([
      [side, 130],
      [side, 100],
    ]);
  });

  it('notifies only the manually resized auto column, not its compensation partner', () => {
    const { runtime, browser, handler } = setup();
    runtime.configure(
      [
        { id: 'first', mode: 'auto', width: 0, floor: 100, max: Infinity, resizable: true },
        { id: 'last', mode: 'auto', width: 0, floor: 100, max: Infinity, resizable: true },
      ],
      ['row'],
      [],
      { rowHeight: 40, minRowHeight: 40, overscan: 0, virtual: true, sticky: true },
    );
    const before = runtime.getColumnWidth('first')!;
    browser.resizeBy('first', 80);
    expect(handler.mock.calls).toEqual([['first', before + 80]]);
    browser.resetColumnWidth('first');
    expect(handler.mock.calls).toEqual([
      ['first', before + 80],
      ['first', before],
    ]);
  });

  it('reports the clamped final width, including a deferred content minimum', () => {
    const { runtime, handler, down, pointer } = setup();
    runtime.configure(
      [
        { id: 'fixed', mode: 'fixed', width: 200, floor: 100, max: 350, measureContent: true, resizable: true },
        { id: 'auto', mode: 'auto', width: 0, floor: 0, max: Infinity },
      ],
      ['row'],
      [],
      { rowHeight: 40, minRowHeight: 40, overscan: 0, virtual: true, sticky: true },
    );
    down();
    pointer('pointermove', 360);
    runtime.commitContentWidths([{ columnId: 'fixed', width: 240 }], runtime.getSnapshot().contentEpoch);
    expect(handler).not.toHaveBeenCalled();
    pointer('pointerup', 360);
    expect(handler.mock.calls).toEqual([['fixed', 240]]);
    down();
    pointer('pointermove', 4000);
    pointer('pointerup', 4000);
    expect(handler.mock.calls.at(-1)).toEqual(['fixed', 350]);
    handler.mockClear();
    down();
    pointer('pointermove', 4000);
    pointer('pointerup', 4000);
    expect(handler).not.toHaveBeenCalled();
  });
  it('does not notify for automatic changes during a captured click without movement', () => {
    const { runtime, handler, down, pointer } = setup();
    runtime.configure(
      [
        { id: 'fixed', mode: 'fixed', width: 200, floor: 0, max: Infinity, measureContent: true, resizable: true },
        { id: 'auto', mode: 'auto', width: 0, floor: 0, max: Infinity },
      ],
      ['row'],
      [],
      { rowHeight: 40, minRowHeight: 40, overscan: 0, virtual: true, sticky: true },
    );
    down();
    runtime.commitContentWidths([{ columnId: 'fixed', width: 240 }], runtime.getSnapshot().contentEpoch);
    pointer('pointerup');
    expect(runtime.getColumnWidth('fixed')).toBe(240);
    expect(handler).not.toHaveBeenCalled();
  });

  it('reports an offscreen active column from full geometry rather than the virtual window', () => {
    const { runtime, handler, down, pointer } = setup();
    runtime.configure(
      [
        { id: 'fixed', mode: 'fixed', width: 200, floor: 0, max: Infinity, resizable: true },
        ...Array.from({ length: 10 }, (_, index) => ({
          id: `other:${index}`,
          mode: 'fixed' as const,
          width: 200,
          floor: 0,
          max: Infinity,
        })),
        { id: 'auto', mode: 'auto', width: 0, floor: 0, max: Infinity },
      ],
      ['row'],
      [],
      { rowHeight: 40, minRowHeight: 40, overscan: 0, virtual: true, sticky: true },
    );
    down();
    pointer('pointermove', 440);
    runtime.updateViewport({ ...runtime.getSnapshot().viewport, left: 1200 });
    expect(runtime.getSnapshot().columns.some((column) => column.id === 'fixed')).toBe(false);
    pointer('pointerup', 440);
    expect(handler.mock.calls).toEqual([['fixed', 220]]);
  });

  it('returns logical width after scale rebasing without notifying during the gesture', () => {
    const { browser, geometry, handler, down, pointer } = setup();
    down();
    pointer('pointermove', 440);
    geometry.scale = 4;
    browser.refresh();
    pointer('pointermove', 480);
    expect(handler).not.toHaveBeenCalled();
    pointer('pointerup', 480);
    expect(handler.mock.calls).toEqual([['fixed', 230]]);
  });

  it('does not notify a parent table when a nested resize handle is reset', () => {
    const { browser, handler, root, surface } = setup();
    root.dataset.table = 'geometry';
    browser.resizeBy('fixed', 20);
    handler.mockClear();
    const nested = document.createElement('div');
    nested.dataset.table = 'geometry';
    const handle = document.createElement('button');
    handle.dataset.resizeColumn = 'fixed';
    nested.append(handle);
    surface.append(nested);
    handle.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    expect(handler).not.toHaveBeenCalled();
  });

  it('supports removing the optional callback during a gesture', () => {
    const { browser, runtime, handler, down, pointer } = setup();
    down();
    pointer('pointermove', 440);
    browser.setResizeHandler(undefined);
    pointer('pointerup', 440);
    expect(runtime.getColumnWidth('fixed')).toBe(220);
    expect(handler).not.toHaveBeenCalled();
  });

  it('finishes a released pointer discovered on move only once', () => {
    const { handler, down, pointer } = setup();
    down();
    pointer('pointermove', 440);
    pointer('pointermove', 440, 0);
    pointer('pointerup', 440);
    expect(handler.mock.calls).toEqual([['fixed', 220]]);
  });

  it('cancels a keyboard gesture on focus loss without notifying', () => {
    const { runtime, browser, handler } = setup();
    browser.resizeByKey('fixed', 20);
    browser.finishKeyResize('fixed', true);
    browser.finishKeyResize('fixed');
    expect(runtime.getColumnWidth('fixed')).toBe(200);
    expect(handler).not.toHaveBeenCalled();
  });
  it('reverses keyboard direction immediately after repeated keys reach a limit', () => {
    const { runtime, browser, handler } = setup();
    runtime.configure(
      [
        { id: 'fixed', mode: 'fixed', width: 200, floor: 100, max: 250, resizable: true },
        { id: 'auto', mode: 'auto', width: 0, floor: 0, max: Infinity },
      ],
      ['row'],
      [],
      { rowHeight: 40, minRowHeight: 40, overscan: 0, virtual: true, sticky: true },
    );
    for (let index = 0; index < 20; index++) browser.resizeByKey('fixed', 10);
    expect(runtime.getColumnWidth('fixed')).toBe(250);
    browser.resizeByKey('fixed', -10);
    expect(runtime.getColumnWidth('fixed')).toBe(240);
    expect(handler).not.toHaveBeenCalled();
    browser.finishKeyResize('fixed');
    expect(handler.mock.calls).toEqual([['fixed', 240]]);
  });
});
