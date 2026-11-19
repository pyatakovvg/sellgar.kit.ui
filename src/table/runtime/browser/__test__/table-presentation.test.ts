// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { TableRuntime } from '../../table-runtime';
import { TableBrowser } from '../table-browser';
import { TablePresentation } from '../table-presentation';
import { numbers } from '../numbers';

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
  vi.spyOn(document.documentElement, 'clientWidth', 'get').mockReturnValue(1200);
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

const numericLength = (value: string): number =>
  Number(value.match(/--numbers-([\d.]+)/)?.[1] ?? parseFloat(value) ?? 0);
const box = (element: HTMLElement, width: number, height: number, top = () => 0) => {
  element.style.cssText = `width:${width}px;height:${height}px;box-sizing:border-box;border:0px solid transparent`;
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
    DOMRect.fromRect({ x: 0, y: top(), width, height }),
  );
};

const fixture = () => {
  const root = document.createElement('div');
  root.dataset.table = 'geometry';
  const source = document.createElement('div');
  const surface = document.createElement('div');
  const body = document.createElement('div');
  body.dataset.tableBody = '';
  const probe = document.createElement('div');
  root.append(source, probe);
  source.append(surface);
  surface.append(body);
  document.body.append(root);
  let nativeTop = 0;
  const renderedHeight = () => numericLength(body.style.height) + 28;
  box(root, 600, 400);
  box(source, 600, 400);
  box(surface, 600, 828, () => -nativeTop);
  box(probe, 100, 0);
  source.style.overflowX = 'auto';
  source.style.overflowY = 'auto';
  Object.defineProperties(source, {
    scrollHeight: { get: renderedHeight },
    scrollTop: {
      get: () => nativeTop,
      set: (value: number) => {
        nativeTop = Math.max(0, Math.min(value, renderedHeight() - 400));
      },
    },
  });
  source.scrollBy = vi.fn((options?: ScrollToOptions | number, top?: number) => {
    source.scrollTop += typeof options === 'number' ? (top ?? 0) : (options?.top ?? 0);
  });
  const runtime = new TableRuntime();
  runtime.configure(
    [
      { id: 'fixed', mode: 'fixed', width: 200, floor: 0, max: Infinity, resizable: true },
      { id: 'auto', mode: 'auto', width: 0, floor: 0, max: Infinity },
    ],
    Array.from({ length: 20 }, (_, index) => `r${index}`),
    [],
    {
      rowHeight: 40,
      minRowHeight: 40,
      overscan: 3,
      virtual: true,
      sticky: true,
      expansion: true,
    },
  );
  runtime.toggleExpanded('r0');
  const browser = new TableBrowser(runtime);
  releases.push(browser.attach(root, surface, probe, source, true));
  return { root, source, surface, body, browser, runtime };
};

const measure = (element: HTMLElement) => {
  observers.find((observer) => observer.elements.has(element))!.notify();
  // A position sample and the adapter flush share the frame. New samples wait for the next frame.
  for (const [id, callback] of [...frames]) {
    frames.delete(id);
    callback(0);
  }
};

describe('Table DOM geometry ownership without React commits', () => {
  it('updates the right-boundary indicator on scroll without changing React render inputs', () => {
    const { surface, browser, runtime } = fixture();
    const control = document.createElement('button');
    control.dataset.resizeColumn = 'fixed';
    control.innerHTML = '<span data-direction="left"></span><span data-direction="right"></span>';
    surface.append(control);
    runtime.beginResize('fixed', 0);
    runtime.moveResize(400);
    runtime.finishResize();
    browser.present();
    const rendering = runtime.getRenderSnapshot();
    const viewport = runtime.getSnapshot().viewport;
    expect(control.querySelector('[data-direction="right"]')?.getAttribute('data-available')).toBe('false');
    runtime.updateViewport({ ...viewport, left: 50 });
    expect(control.querySelector('[data-direction="right"]')?.getAttribute('data-available')).toBe('true');
    expect(runtime.getRenderSnapshot()).toBe(rendering);
    runtime.updateViewport(viewport);
    expect(control.querySelector('[data-direction="right"]')?.getAttribute('data-available')).toBe('false');
    expect(control.getAttribute('aria-description')).toContain('вправо нельзя');
  });

  it('applies the new native extent before scroll correction at the bottom limit', () => {
    const { source, surface, body, browser, runtime } = fixture();
    source.scrollTop = 428;
    browser.refresh();
    const content = document.createElement('div');
    surface.append(content);
    box(content, 200, 240);
    releases.push(browser.observeCell(content, 'r0', 'fixed'));
    measure(content);
    expect(runtime.getSnapshot().bodyHeight).toBe(1000);
    expect(body.style.height).toBe(numbers(1000));
    expect(source.scrollBy).toHaveBeenCalledWith({ top: 200, behavior: 'instant' });
    expect(source.scrollTop).toBe(628);
    expect(runtime.getSnapshot().viewport.scroll).toBe(628);
  });

  it('applies resize to all existing grids and keeps measurements live across geometry epochs', () => {
    const { surface, browser, runtime } = fixture();
    const line = document.createElement('div');
    line.dataset.tableLine = 'r0';
    const header = document.createElement('div');
    header.dataset.tableHeader = '';
    const content = document.createElement('div');
    line.append(content);
    surface.append(line, header);
    releases.push(browser.observeCell(content, 'r0', 'fixed'));
    box(content, 200, 90);
    const previousVersion = runtime.getSnapshot().version;
    browser.resizeBy('fixed', 100);
    expect(runtime.getSnapshot().version).toBeGreaterThan(previousVersion);
    expect(line.style.gridTemplateColumns).toBe(`${numbers(300)} ${numbers(300)}`);
    expect(header.style.gridTemplateColumns).toBe(line.style.gridTemplateColumns);
    for (const [id, callback] of [...frames]) {
      frames.delete(id);
      callback(0);
    }
    expect(runtime.getSnapshot().rows.find((row) => row.id === 'r0')?.contentHeight).toBe(90);
  });

  it('remeasures an expanded block after a pending measurement loses its geometry epoch', () => {
    const { surface, browser, runtime } = fixture();
    const expanded = document.createElement('div');
    expanded.dataset.tableExpanded = 'r0';
    surface.append(expanded);
    box(expanded, 600, 120);
    releases.push(browser.observeExpanded(expanded, 'r0'));
    observers.find((observer) => observer.elements.has(expanded))!.notify();
    browser.resizeBy('fixed', 100);
    // No additional ResizeObserver event and no React effect re-registration.
    for (const [id, callback] of [...frames]) {
      frames.delete(id);
      callback(0);
    }
    expect(runtime.getSnapshot().rows.find((row) => row.id === 'r0')?.height).toBe(160);
  });

  it('switches portal placement and vertical position on native viewport updates before React renders', () => {
    const { root, source, surface, browser } = fixture();
    const slot = document.createElement('div');
    const portal = document.createElement('div');
    const mount = document.createElement('div');
    const layer = document.createElement('div');
    layer.dataset.tableHeaderLayer = '';
    const header = document.createElement('div');
    header.dataset.tableHeader = '';
    box(header, 600, 28);
    layer.append(header);
    mount.append(layer);
    slot.append(mount);
    surface.prepend(slot);
    root.append(portal);
    releases.push(browser.attachHeader(header), browser.attachHeaderPlacement(mount, slot, portal));
    source.scrollTop = 100;
    browser.refresh();
    expect(mount.parentElement).toBe(portal);
    expect(layer.dataset.tableHeaderPosition).toBe('portal');
    expect(layer.style.top).toBe(numbers(0));
    expect(header.style.transform).toBe(`translateY(${numbers(0)})`);
    source.scrollTop = 0;
    browser.refresh();
    expect(mount.parentElement).toBe(slot);
    expect(layer.dataset.tableHeaderPosition).toBe('flow');
    expect(layer.style.top).toBe('');
  });

  it('moves the same header synchronously and preserves flow extent during return from the portal', () => {
    const { root, surface, runtime } = fixture();
    const slot = document.createElement('div');
    const portal = document.createElement('div');
    const mount = document.createElement('div');
    const layer = document.createElement('div');
    layer.dataset.tableHeaderLayer = '';
    const header = document.createElement('div');
    header.dataset.tableHeader = '';
    const button = document.createElement('button');
    header.append(button);
    layer.append(header);
    mount.append(layer);
    slot.append(mount);
    surface.prepend(slot);
    root.append(portal);
    const presenter = new TablePresentation();
    const state = runtime.getSnapshot();
    button.focus();
    presenter.apply(root, surface, { ...state, headerFloating: true, headerTop: 7 }, { mount, slot, portal });
    expect(mount.parentElement).toBe(portal);
    expect(document.activeElement).toBe(button);
    expect(slot.style.height).toBe(numbers(28));
    expect(header.style.transform).toBe(`translateY(${numbers(7)})`);
    expect(layer.dataset.tableHeaderPosition).toBe('portal');
    const append = vi.spyOn(slot, 'appendChild');
    append.mockImplementation((node) => {
      expect(slot.style.height).toBe(numbers(28));
      return Node.prototype.appendChild.call(slot, node);
    });
    presenter.apply(root, surface, { ...state, headerFloating: false }, { mount, slot, portal });
    expect(mount.parentElement).toBe(slot);
    expect(document.activeElement).toBe(button);
    expect(slot.style.height).toBe('');
    expect(header.style.transform).toBe('');
    expect(layer.style.top).toBe('');
    expect(layer.dataset.tableHeaderPosition).toBe('flow');
  });

  it('keeps body pins native and applies fixed header pins in the same viewport geometry', () => {
    const { root, surface, runtime } = fixture();
    runtime.configure(
      [
        { id: 'left', mode: 'fixed', width: 100, floor: 0, max: Infinity, pin: 'left' },
        { id: 'auto', mode: 'auto', width: 0, floor: 0, max: Infinity },
        { id: 'right', mode: 'fixed', width: 100, floor: 0, max: Infinity, pin: 'right' },
      ],
      ['r0'],
      [],
      { rowHeight: 40, minRowHeight: 40, virtual: true, sticky: true, overscan: 0, pinning: { reserve: 50 } },
    );
    const slot = document.createElement('div');
    const portal = document.createElement('div');
    const mount = document.createElement('div');
    const layer = document.createElement('div');
    layer.dataset.tableHeaderLayer = '';
    mount.append(layer);
    slot.append(mount);
    surface.prepend(slot);
    root.append(portal);
    const cells = ['left', 'right'].map((id) => {
      const body = document.createElement('div');
      const header = document.createElement('div');
      for (const cell of [body, header]) {
        cell.dataset.columnId = id;
        cell.dataset.columnRegion = id;
      }
      body.setAttribute('role', 'cell');
      header.setAttribute('role', 'columnheader');
      surface.append(body);
      layer.append(header);
      return { body, header };
    });
    new TablePresentation().apply(
      root,
      surface,
      { ...runtime.getSnapshot(), headerFloating: true },
      { mount, slot, portal },
    );
    expect(cells[0].body.style.position).toBe('sticky');
    expect(cells[0].body.style.left).toBe(numbers(0));
    expect(cells[1].body.style.right).toBe(numbers(0));
    expect(cells[0].header.style.position).toBe('absolute');
    expect(cells[0].header.style.left).toBe(numbers(0));
    expect(cells[1].header.style.left).toBe(numbers(500));
    expect(cells[1].header.style.width).toBe(numbers(100));
    for (const { body, header } of cells) {
      expect(body.style.transform).toBe('');
      expect(header.style.transform).toBe('');
    }
  });

  it('keeps boundary handles above transformed neighbours and both pin groups above the center', () => {
    const { root, surface, runtime } = fixture();
    const regions = ['left', 'left', 'center', 'center', 'right', 'right'] as const;
    runtime.configure(
      regions.map((region, index) => ({
        id: `c${index}`,
        mode: region === 'center' ? 'auto' : 'fixed',
        width: region === 'center' ? 0 : 100,
        floor: 0,
        max: Infinity,
        pin: region === 'center' ? undefined : region,
        resizable: true,
      })),
      ['r0'],
      [],
      { rowHeight: 40, minRowHeight: 40, virtual: false, sticky: true, overscan: 0 },
    );
    const cells = regions.map((region, index) => {
      const header = document.createElement('div');
      const body = document.createElement('div');
      for (const cell of [header, body]) {
        cell.dataset.columnId = `c${index}`;
        cell.dataset.columnRegion = region;
        surface.append(cell);
      }
      header.setAttribute('role', 'columnheader');
      header.style.transform = 'translateX(0px)';
      body.setAttribute('role', 'cell');
      return { header, body };
    });

    new TablePresentation().apply(root, surface, runtime.getSnapshot());

    const levels = cells.map(({ header }) => Number(header.style.zIndex));
    expect(levels[2]).toBeGreaterThan(levels[3]);
    expect(levels[0]).toBeGreaterThan(levels[1]);
    expect(levels[5]).toBeGreaterThan(levels[4]);
    expect(Math.min(levels[0], levels[1], levels[4], levels[5])).toBeGreaterThan(Math.max(levels[2], levels[3]));
    for (const { body } of cells) expect(body.style.zIndex).toBe('');
  });

  it.each(['left', 'right'] as const)(
    'applies %s pin resize to header/body without React through limit overshoot and reversals',
    (side) => {
      const { root, source, surface, browser, runtime } = fixture();
      runtime.configure(
        [
          { id: 'left', mode: 'fixed', width: 100, floor: 50, max: Infinity, pin: 'left', resizable: true },
          { id: 'auto', mode: 'auto', width: 0, floor: 50, max: Infinity },
          { id: 'right', mode: 'fixed', width: 100, floor: 50, max: Infinity, pin: 'right', resizable: true },
        ],
        Array.from({ length: 20 }, (_, index) => `r${index}`),
        [],
        {
          rowHeight: 40,
          minRowHeight: 40,
          virtual: true,
          sticky: true,
          overscan: 0,
          pinning: { reserve: 50 },
        },
      );
      const slot = document.createElement('div');
      const portal = document.createElement('div');
      const mount = document.createElement('div');
      const layer = document.createElement('div');
      const header = document.createElement('div');
      header.dataset.tableHeader = '';
      const line = document.createElement('div');
      line.dataset.tableLine = 'r3';
      layer.dataset.tableHeaderLayer = '';
      layer.append(header);
      mount.append(layer);
      slot.append(mount);
      surface.prepend(slot);
      surface.append(line);
      root.append(portal);
      box(header, 600, 28);
      const cells = new Map(
        ['left', 'auto', 'right'].map((id) => {
          const body = document.createElement('div');
          const head = document.createElement('div');
          for (const cell of [body, head]) {
            cell.dataset.columnId = id;
            cell.dataset.columnRegion = id === 'auto' ? 'center' : id;
          }
          body.setAttribute('role', 'cell');
          head.setAttribute('role', 'columnheader');
          line.append(body);
          header.append(head);
          return [id, { body, head }] as const;
        }),
      );
      releases.push(browser.attachHeader(header), browser.attachHeaderPlacement(mount, slot, portal));
      source.scrollTop = 100;
      browser.refresh();
      expect(mount.parentElement).toBe(portal);
      const start = side === 'left' ? 100 : 500;
      const sign = side === 'left' ? 1 : -1;
      expect(runtime.beginPinResize(side, start, side === 'left' ? 'right' : 'left')).toBe(true);
      const requests = [600, -200, -150, 50, 80, 100, 160, 100];
      const expected = [450, 50, 50, 50, 80, 100, 160, 100];
      requests.forEach((requested, index) => {
        runtime.moveResize(start + sign * (requested - 100));
        const state = runtime.getSnapshot();
        const width = state.columns.find((column) => column.id === side)!.width;
        const opposite = side === 'left' ? 'right' : 'left';
        expect(width).toBe(expected[index]);
        expect(state.columns.find((column) => column.id === opposite)!.width).toBe(100);
        expect(state.total).toBe(600);
        expect(state.pinning?.status).toBe('active');
        expect(header.style.gridTemplateColumns).toBe(state.widths.map(numbers).join(' '));
        expect(line.style.gridTemplateColumns).toBe(header.style.gridTemplateColumns);
        expect(cells.get(side)!.head.style.width).toBe(numbers(width));
        expect(cells.get(side)!.head.style.left).toBe(numbers(side === 'left' ? 0 : 600 - width));
        expect(cells.get(side)!.body.style.position).toBe('sticky');
        expect(cells.get(side)!.body.style.getPropertyValue(side)).toBe(numbers(0));
        expect(cells.get(opposite)!.head.style.width).toBe(numbers(100));
      });
      runtime.finishResize();
      expect(runtime.getSnapshot().dragging).toBe(false);
      expect(cells.get(side)!.head.style.width).toBe(numbers(100));
    },
  );

  it('reconciles newly mounted rows and leaves nested table geometry to its own owner', () => {
    const { root, surface, browser, runtime } = fixture();
    const row = document.createElement('div');
    row.dataset.tableRow = 'r0';
    const nested = document.createElement('div');
    nested.dataset.table = 'geometry';
    const nestedRow = document.createElement('div');
    nestedRow.dataset.tableRow = 'r0';
    nestedRow.style.height = '123px';
    nested.append(nestedRow);
    row.append(nested);
    surface.append(row);
    browser.present();
    expect(row.style.height).toBe(numbers(runtime.getSnapshot().rows[0].height));
    expect(nestedRow.style.height).toBe('123px');
    const orphan = document.createElement('div');
    orphan.dataset.tableRow = 'removed';
    surface.append(orphan);
    browser.present();
    expect(orphan.style.display).toBe('none');
    expect(root.dataset.totalWidth).toBe('600');
  });
  it('skips bulk body scans on native scroll and reconciles new DOM after a React commit', () => {
    const { root, source, surface, browser, runtime } = fixture();
    browser.present();
    const revision = runtime.getGeometryRevision();
    const render = runtime.getRenderSnapshot();
    const query = vi.spyOn(root, 'querySelectorAll');
    source.scrollTop = 20;
    browser.refresh();
    expect(runtime.getSnapshot().viewport.scroll).toBe(20);
    expect(runtime.getGeometryRevision()).toBe(revision);
    expect(runtime.getRenderSnapshot()).toBe(render);
    expect(query.mock.calls.map(([selector]) => selector)).not.toContain('[data-table-line]');
    expect(query.mock.calls.map(([selector]) => selector)).not.toContain('[data-column-id][data-column-region]');

    const row = document.createElement('div');
    row.dataset.tableRow = 'r1';
    const line = document.createElement('div');
    line.dataset.tableLine = 'r1';
    row.append(line);
    surface.append(row);
    browser.present();
    expect(row.style.top).toBe(numbers(runtime.getRowGeometry('r1')!.top));
    expect(row.style.height).toBe(numbers(40));
    expect(line.style.gridTemplateColumns).toBe(`${numbers(200)} ${numbers(400)}`);

    query.mockClear();
    browser.resizeBy('fixed', 100);
    expect(runtime.getGeometryRevision()).toBeGreaterThan(revision);
    expect(query.mock.calls.map(([selector]) => selector)).toContain('[data-table-line]');
    expect(line.style.gridTemplateColumns).toBe(`${numbers(300)} ${numbers(300)}`);
  });

  it('does not publish or rescan unchanged nested width constraints', () => {
    const { root, runtime } = fixture();
    runtime.setNestedWidth('child', 700);
    const publish = vi.fn();
    releases.push(runtime.subscribe(publish));
    const revision = runtime.getGeometryRevision();
    const query = vi.spyOn(root, 'querySelectorAll');
    runtime.setNestedWidth('child', 700);
    expect(runtime.getGeometryRevision()).toBe(revision);
    expect(publish).not.toHaveBeenCalled();
    expect(query).not.toHaveBeenCalled();
    runtime.setNestedWidth('child', undefined);
    expect(publish).toHaveBeenCalledOnce();
    expect(runtime.getGeometryRevision()).toBeGreaterThan(revision);
  });

  it('keeps valid old DOM positioned until the replacement window commits, but hides removed data', () => {
    const { surface, runtime, browser } = fixture();
    const oldRow = document.createElement('div');
    oldRow.dataset.tableRow = 'r1';
    const oldLine = document.createElement('div');
    oldLine.dataset.tableLine = 'r1';
    const cell = document.createElement('div');
    cell.dataset.columnId = 'fixed';
    cell.dataset.columnRegion = 'center';
    oldLine.append(cell);
    oldRow.append(oldLine);
    surface.append(oldRow);
    browser.present();
    const originalTop = oldRow.style.top;
    runtime.updateViewport({ ...runtime.getSnapshot().viewport, scroll: 700, height: 100 });
    expect(runtime.getSnapshot().rows.some((row) => row.id === 'r1')).toBe(false);
    expect(oldRow.style.display).toBe('');
    expect(oldRow.style.top).toBe(originalTop);
    runtime.configure([{ id: 'auto', mode: 'auto', width: 0, floor: 0, max: Infinity }], ['new-row'], [], {
      rowHeight: 40,
      minRowHeight: 40,
      overscan: 3,
      virtual: true,
      sticky: true,
    });
    expect(oldRow.style.display).toBe('none');
    expect(cell.style.display).toBe('none');
  });
});

describe('Empty surface presentation', () => {
  it('uses available width instead of saved column widths and restores the data surface', () => {
    const { root, surface, runtime } = fixture();
    const presentation = new TablePresentation();
    const data = {
      ...runtime.getSnapshot(),
      total: 1200,
      viewport: { ...runtime.getSnapshot().viewport, container: 600 },
    };
    const empty = { ...data, rowCount: 0, headerFloating: true, bodyHeight: 120 };
    presentation.apply(root, surface, empty, undefined, runtime);
    expect(surface.style.width).toBe(numbers(600));
    expect(surface.style.minHeight).toBe(numbers(120));
    presentation.apply(root, surface, data, undefined, runtime);
    expect(surface.style.width).toBe(numbers(1200));
    expect(surface.style.minHeight).toBe('');
  });

  it('limits empty embedded content to the shared viewport without moving it into the header portal', () => {
    const { root, surface, runtime } = fixture();
    const presentation = new TablePresentation();
    const slot = document.createElement('div');
    const portal = document.createElement('div');
    const mount = document.createElement('div');
    slot.append(mount);
    surface.append(slot, portal);
    const empty = document.createElement('div');
    empty.dataset.tableEmpty = 'true';
    surface.append(empty);
    const data = runtime.getSnapshot();
    presentation.apply(
      root,
      surface,
      {
        ...data,
        rowCount: 0,
        total: 1900,
        headerFloating: true,
        viewport: { ...data.viewport, container: 1200, available: 500 },
      },
      { mount, slot, portal },
      runtime,
    );
    expect(surface.style.width).toBe(numbers(1200));
    expect(empty.style.width).toBe(numbers(500));
    expect(mount.parentElement).toBe(slot);
  });
});
