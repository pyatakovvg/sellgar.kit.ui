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
  return { browser, runtime, geometry, root, surface, probe, ownerScroll, internalScroll };
};

describe('Table browser coordinate spaces', () => {
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
    expect(internalScroll).toHaveBeenCalledWith({ top: 40 });
  });

  it('retains screen compensation for an external owner outside the transform', () => {
    const { browser, ownerScroll } = fixture(false);
    browser.correctScroll(40);
    expect(ownerScroll).toHaveBeenCalledWith({ top: 80 });
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
    expect(internalScroll).toHaveBeenCalledWith({ top: 80 });
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
});
