import { describe, expect, it } from 'vitest';

import { createGeometryColumns } from '../../core/layout/create-columns';
import { TableRuntime } from '../table-runtime';

import type { GeometryColumn } from '../../core/layout/types';
import type { TableRuntimeOptions, TableViewport } from '../types';

const OPTIONS: TableRuntimeOptions = {
  rowHeight: 40,
  minRowHeight: 32,
  overscan: 2,
  virtual: false,
  sticky: true,
  pinning: { reserve: 50 },
};
const VIEWPORT: TableViewport = {
  container: 1000,
  width: 1000,
  height: 500,
  scroll: 0,
  left: 0,
  top: 0,
  screenLeft: 0,
  scale: 1,
};
const fixed = (id: string, width: number, pin?: 'left' | 'right'): GeometryColumn => ({
  id,
  mode: 'fixed',
  width,
  floor: 0,
  max: Infinity,
  resizable: true,
  ...(pin ? { pin } : {}),
});
const auto = (id: string, floor = 0, pin?: 'left' | 'right', manual?: number): GeometryColumn => ({
  id,
  mode: 'auto',
  width: 0,
  floor,
  max: Infinity,
  resizable: true,
  ...(pin ? { pin } : {}),
  ...(manual === undefined ? {} : { manual }),
});
const COLUMNS = [fixed('left', 200, 'left'), auto('name', 100), fixed('right', 100, 'right')];
const createRuntime = (columns = COLUMNS, options = OPTIONS, viewport = VIEWPORT) => {
  const runtime = new TableRuntime();
  runtime.configure(columns, ['row'], [], options);
  runtime.updateViewport(viewport);
  return runtime;
};
const widths = (runtime: TableRuntime) =>
  Object.fromEntries(runtime.getSnapshot().columns.map((column) => [column.id, column.width]));

describe('Table runtime declarative pinning', () => {
  it.each(['left', 'right'] as const)(
    'uses the center capacity for %s pin indicators and limit overshoot reversals',
    (side) => {
      const runtime = createRuntime(
        [
          { ...fixed('pin', 250, side), floor: 50 },
          { ...auto('center', 50), max: 300 },
        ],
        OPTIONS,
        { ...VIEWPORT, container: 500, width: 500 },
      );
      const pin = () => runtime.getSnapshot().columns.find((column) => column.id === 'pin')!;
      expect(pin()).toMatchObject({ width: 250, left: true, right: true, resizeBounds: { min: 200, max: 450 } });
      const edge = side === 'left' ? 'right' : 'left';
      const direction = side === 'left' ? 1 : -1;
      expect(runtime.beginPinResize('pin', 250, edge)).toBe(true);
      runtime.moveResize(250 - 500 * direction);
      expect(pin()).toMatchObject({
        width: 200,
        left: side === 'right',
        right: side === 'left',
        resizeBounds: { min: 200, max: 450 },
      });
      runtime.moveResize(250 - 100 * direction);
      expect(pin().width).toBe(200);
      runtime.moveResize(250 - 49 * direction);
      expect(pin().width).toBe(201);
      expect(runtime.getSnapshot().error).toBeUndefined();
      runtime.cancelResize();
      expect(pin().width).toBe(250);
    },
  );

  it('uses the shared surface, other pins and fixed center widths in the reachable minimum', () => {
    const runtime = createRuntime(
      [
        fixed('left', 250, 'left'),
        fixed('fixed-center', 100),
        { ...auto('center'), max: 200 },
        fixed('right', 50, 'right'),
      ],
      OPTIONS,
      { ...VIEWPORT, container: 600, width: 500 },
    );
    expect(runtime.getSnapshot().columns.find((column) => column.id === 'left')).toMatchObject({
      width: 250,
      left: false,
      right: true,
      resizeBounds: { min: 250, max: 400 },
    });
    expect(runtime.beginPinResize('left', 250, 'right')).toBe(true);
    runtime.moveResize(0);
    expect(widths(runtime)).toEqual({ left: 250, 'fixed-center': 100, center: 200, right: 50 });
    expect(runtime.getSnapshot().error).toBeUndefined();
  });

  it('rejects a pin drag when the budget and center capacity leave no reachable movement', () => {
    const runtime = createRuntime(
      [
        { ...fixed('pin', 200, 'left'), max: 200 },
        { ...auto('center'), max: 300 },
      ],
      OPTIONS,
      { ...VIEWPORT, container: 500, width: 500 },
    );
    expect(runtime.getSnapshot().columns.find((column) => column.id === 'pin')).toMatchObject({
      left: false,
      right: false,
      resizeBounds: { min: 200, max: 200 },
    });
    expect(runtime.beginPinResize('pin', 200, 'right')).toBe(false);
  });

  it('preserves pin declarations through column compilation and publishes unified geometry', () => {
    const columns = createGeometryColumns([
      { columnId: 'right', sourceIndex: 0, width: 100, pinRight: true, resizable: true },
      { columnId: 'name', sourceIndex: 1 },
      { columnId: 'left', sourceIndex: 2, width: 200, pinLeft: true, resizable: true },
    ]);
    const runtime = createRuntime(columns);
    expect(runtime.getSnapshot()).toMatchObject({
      error: undefined,
      widths: [200, 700, 100],
      total: 1000,
      pinning: { status: 'active', reserve: 50 },
    });
    expect(
      runtime
        .getSnapshot()
        .columns.map(({ id, index, sourceIndex, region, displayOffset }) => [
          id,
          index,
          sourceIndex,
          region,
          displayOffset,
        ]),
    ).toEqual([
      ['left', 0, 2, 'left', 0],
      ['name', 1, 1, 'center', 200],
      ['right', 2, 0, 'right', 900],
    ]);
    expect(runtime.getSnapshot().regions).toEqual({
      left: { start: 0, end: 200 },
      center: { start: 200, end: 900 },
      right: { start: 900, end: 1000 },
    });
    expect(runtime.getSnapshot().columns.at(-1)).toMatchObject({
      id: 'right',
      resizable: true,
      resizeBounds: { min: 0, max: 750 },
    });
  });

  it('publishes physical direction indicators for each pin handle edge at min and max', () => {
    const runtime = createRuntime();
    const pin = (id: string) => runtime.getSnapshot().columns.find((column) => column.id === id)!;
    expect(pin('left')).toMatchObject({ resizeEdge: 'right', left: true, right: true });
    expect(pin('right')).toMatchObject({ resizeEdge: 'left', left: true, right: true, resizable: true });
    expect(runtime.beginPinResize('right', 900, 'left')).toBe(true);
    runtime.moveResize(2000);
    expect(pin('right')).toMatchObject({ width: 0, left: true, right: false });
    runtime.moveResize(-1000);
    expect(pin('right')).toMatchObject({ width: 750, left: false, right: true });
    runtime.cancelResize();
    expect(runtime.beginPinResize('left', 200, 'right')).toBe(true);
    runtime.moveResize(-1000);
    expect(pin('left')).toMatchObject({ width: 0, left: false, right: true });
    runtime.moveResize(2000);
    expect(pin('left')).toMatchObject({ width: 850, left: true, right: false });
  });

  it.each([
    { pinning: undefined, reserve: 50, maximum: 850 },
    { pinning: {}, reserve: 50, maximum: 850 },
    { pinning: { reserve: undefined }, reserve: 50, maximum: 850 },
    { pinning: { reserve: 0 }, reserve: 0, maximum: 900 },
    { pinning: { reserve: 100 }, reserve: 100, maximum: 800 },
  ])('uses reserve $reserve for pinning=$pinning', ({ pinning, reserve, maximum }) => {
    const runtime = createRuntime(COLUMNS, { ...OPTIONS, pinning });
    expect(runtime.getSnapshot()).toMatchObject({ error: undefined, pinning: { status: 'active', reserve } });
    expect(runtime.beginPinResize('left', 200, 'right')).toBe(true);
    runtime.moveResize(10000);
    expect(widths(runtime).left).toBe(maximum);
    expect(widths(runtime).right).toBe(100);
  });

  it.each([-1, NaN, Infinity])(
    'rejects invalid explicit reserve %s instead of replacing it with the default',
    (reserve) => {
      expect(createRuntime(COLUMNS, { ...OPTIONS, pinning: { reserve } }).getSnapshot().error).toMatch(/reserve/);
    },
  );

  it('treats omitted reserve and explicit 50 as the same resize environment', () => {
    const runtime = createRuntime(COLUMNS, { ...OPTIONS, pinning: undefined });
    expect(runtime.beginPinResize('left', 200, 'right')).toBe(true);
    runtime.moveResize(300);
    runtime.configure(COLUMNS, ['row'], [], OPTIONS);
    expect(runtime.getSnapshot().dragging).toBe(true);
    expect(widths(runtime).left).toBe(300);
    runtime.cancelResize();
    expect(widths(runtime).left).toBe(200);
  });

  it('uses the default reserve for the shared suspension and restoration threshold', () => {
    const runtime = createRuntime(COLUMNS, { ...OPTIONS, pinning: undefined });
    const saved = runtime.getSnapshot().pinning!.columns;
    runtime.updateViewport({ ...VIEWPORT, width: 349, container: 349 });
    expect(runtime.getSnapshot().pinning).toMatchObject({ status: 'suspended', reserve: 50, columns: saved });
    runtime.updateViewport({ ...VIEWPORT, width: 350, container: 350 });
    expect(runtime.getSnapshot().pinning).toMatchObject({ status: 'active', reserve: 50, columns: saved });
  });

  it('requires an automatic center', () => {
    expect(createRuntime([auto('left', 0, 'left'), fixed('center', 200)]).getSnapshot().error).toMatch(
      /automatic center/,
    );
    expect(createRuntime([auto('only', 0, 'left')]).getSnapshot().error).toMatch(/automatic center/);
  });

  it('does not initialize pin from the zero viewport before the first measurement even with reserve zero', () => {
    const runtime = new TableRuntime();
    runtime.configure(COLUMNS, ['row'], [], { ...OPTIONS, pinning: { reserve: 0 } });
    expect(runtime.getSnapshot().pinning).toMatchObject({ status: 'suspended', columns: [] });
    runtime.updateViewport(VIEWPORT);
    expect(widths(runtime)).toEqual({ left: 200, name: 700, right: 100 });
  });

  it('initializes auto pin from base and ignores its ordinary manual request', () => {
    const runtime = createRuntime([auto('left', 100, 'left', 5000), auto('name', 100), fixed('right', 100, 'right')]);
    expect(widths(runtime)).toEqual({ left: 450, name: 450, right: 100 });
    expect(runtime.getSnapshot().minimumWidth).toBe(650);
  });

  it('uses the batch policy when several desired initial widths do not fit', () => {
    const runtime = createRuntime(
      [fixed('left', 600, 'left'), auto('name'), fixed('right', 600, 'right')].map((column) =>
        column.pin ? { ...column, floor: 100 } : column,
      ),
    );
    expect(widths(runtime)).toEqual({ left: 475, name: 50, right: 475 });
  });

  it('keeps pin widths independent and applies the shared budget to either side', () => {
    const runtime = createRuntime();
    expect(runtime.beginResize('left', 200)).toBe(false);
    expect(runtime.beginPinResize('left', 200, 'right')).toBe(true);
    runtime.moveResize(2000);
    runtime.finishResize();
    expect(widths(runtime)).toEqual({ left: 850, name: 100, right: 100 });
    expect(runtime.getSnapshot().pinning?.columns.map((column) => column.width)).toEqual([850, 100]);
    expect(runtime.beginPinResize('right', 900, 'left')).toBe(true);
    runtime.moveResize(800);
    runtime.finishResize();
    expect(widths(runtime).right).toBe(100);
    expect(widths(runtime).left).toBe(850);
    runtime.beginPinResize('left', 850, 'right');
    runtime.moveResize(300);
    runtime.finishResize();
    runtime.beginPinResize('right', 900, 'left');
    runtime.moveResize(500);
    runtime.finishResize();
    expect(widths(runtime)).toEqual({ left: 300, name: 200, right: 500 });
  });

  it('uses a mirrored pointer axis only when the caller supplies a left edge', () => {
    const runtime = createRuntime();
    runtime.beginPinResize('right', 900, 'left');
    runtime.moveResize(800);
    expect(widths(runtime)).toEqual({ left: 200, name: 600, right: 200 });
    runtime.moveResize(950);
    expect(widths(runtime).right).toBe(50);
    runtime.cancelResize();
    expect(widths(runtime)).toEqual({ left: 200, name: 700, right: 100 });
  });

  it('preserves the grab point across min/max and repeated reversals in one held pin drag', () => {
    const columns = COLUMNS.map((column) => (column.id === 'left' ? { ...column, floor: 100, max: 800 } : column));
    const runtime = createRuntime(columns);
    runtime.beginPinResize('left', 200, 'right');
    const actual: number[] = [];
    for (const x of [500, -100, -80, 80, 100, 120, 1000, 980, 800, 780]) {
      runtime.moveResize(x);
      actual.push(widths(runtime).left);
      expect(runtime.getSnapshot().dragging).toBe(true);
    }
    expect(actual).toEqual([500, 100, 100, 100, 100, 120, 800, 800, 800, 780]);
    runtime.cancelResize();
    expect(widths(runtime).left).toBe(200);
  });

  it('keeps default opt-out and permissions separate from the global last column', () => {
    const runtime = createRuntime(
      COLUMNS.map((column) => ({ ...column, resizable: column.id === 'right' ? undefined : true })),
    );
    expect(runtime.beginPinResize('right', 900, 'left')).toBe(false);
    expect(runtime.beginResize('name', 200)).toBe(false);
    runtime.configure(COLUMNS, ['row'], [], OPTIONS);
    expect(runtime.beginPinResize('right', 900, 'left')).toBe(true);
    runtime.cancelResize();
  });

  it('never offers pin as an ordinary compensating auto column', () => {
    const runtime = createRuntime([
      auto('left', 100, 'left'),
      fixed('code', 200),
      auto('name', 100),
      auto('right', 100, 'right'),
    ]);
    const before = runtime.getSnapshot().pinning!.columns;
    runtime.beginResize('code', 200);
    runtime.moveResize(1000);
    runtime.finishResize();
    expect(widths(runtime).code).toBe(1000);
    expect(widths(runtime).name).toBe(100);
    expect(runtime.getSnapshot().pinning!.columns).toEqual(before);
    expect(runtime.getSnapshot().columns.find((column) => column.id === 'name')?.resizable).toBe(false);
  });

  it('preserves ordinary directed resize and its anchor through a viewport round trip', () => {
    const runtime = createRuntime([
      fixed('left', 100, 'left'),
      fixed('code', 200),
      auto('name', 100),
      auto('extra', 100),
      fixed('right', 100, 'right'),
    ]);
    runtime.beginResize('code', 300);
    runtime.moveResize(500);
    runtime.finishResize();
    const before = widths(runtime);
    expect(before).toEqual({ left: 100, code: 400, name: 200, extra: 200, right: 100 });
    runtime.updateViewport({ ...VIEWPORT, width: 900, container: 900 });
    runtime.updateViewport({ ...VIEWPORT, width: 1200, container: 1200 });
    runtime.updateViewport(VIEWPORT);
    expect(widths(runtime)).toEqual(before);
  });

  it('projects scroll without changing widths, version or the pin pointer origin', () => {
    const runtime = createRuntime();
    runtime.beginPinResize('right', 900, 'left');
    runtime.moveResize(850);
    const before = runtime.getSnapshot();
    runtime.updateViewport({ ...VIEWPORT, left: 400, scroll: 150 });
    expect(runtime.getSnapshot().widths).toEqual(before.widths);
    expect(runtime.getSnapshot().version).toBe(before.version);
    expect(runtime.getSnapshot().columns.map((column) => column.displayOffset)).toEqual([0, -200, 850]);
    runtime.moveResize(800);
    expect(widths(runtime).right).toBe(200);
    runtime.cancelResize();
    expect(widths(runtime).right).toBe(100);
  });

  it('mounts both pin groups once alongside the virtual center window', () => {
    const columns = [
      fixed('left', 100, 'left'),
      ...Array.from({ length: 15 }, (_, i) => fixed('c' + i, 150)),
      auto('fill', 150),
      fixed('right', 100, 'right'),
    ];
    const runtime = createRuntime(columns, { ...OPTIONS, virtual: true });
    runtime.updateViewport({ ...VIEWPORT, left: 1700 });
    const visible = runtime.getSnapshot().columns;
    expect(visible[0]).toMatchObject({ id: 'left', displayOffset: 0 });
    expect(visible.at(-1)).toMatchObject({ id: 'right', displayOffset: 900 });
    expect(visible.some((column) => column.id === 'c0')).toBe(false);
    expect(visible.length).toBeLessThan(columns.length);
    expect(new Set(visible.map((column) => column.id)).size).toBe(visible.length);
  });

  it('suspends all pin on budget failure and restores saved widths when space returns', () => {
    const runtime = createRuntime();
    runtime.beginPinResize('left', 200, 'right');
    runtime.moveResize(600);
    runtime.finishResize();
    const saved = runtime.getSnapshot().pinning!.columns;
    runtime.updateViewport({ ...VIEWPORT, container: 650, width: 650 });
    expect(runtime.getSnapshot().pinning).toMatchObject({ status: 'suspended', columns: saved });
    expect(widths(runtime)).toEqual({ left: 200, name: 350, right: 100 });
    expect(runtime.getSnapshot().regions).toBeUndefined();
    runtime.updateViewport(VIEWPORT);
    expect(runtime.getSnapshot().pinning).toMatchObject({ status: 'active', columns: saved });
    expect(widths(runtime)).toEqual({ left: 600, name: 300, right: 100 });
  });

  it('suspends until all initial minima fit, without partially initializing a batch', () => {
    const columns = [fixed('left', 400, 'left'), auto('name'), fixed('right', 400, 'right')].map((column) =>
      column.pin ? { ...column, floor: 400 } : column,
    );
    const runtime = createRuntime(columns, OPTIONS, { ...VIEWPORT, container: 600, width: 600 });
    expect(runtime.getSnapshot().pinning).toMatchObject({ status: 'suspended', columns: [] });
    expect(runtime.getSnapshot().error).toBeUndefined();
    runtime.updateViewport(VIEWPORT);
    expect(widths(runtime)).toEqual({ left: 400, name: 200, right: 400 });
  });

  it('handles a viewport smaller than the reserve with ordinary scrolling', () => {
    const runtime = createRuntime();
    const saved = runtime.getSnapshot().pinning!.columns;
    runtime.updateViewport({ ...VIEWPORT, container: 20, width: 20 });
    expect(runtime.getSnapshot()).toMatchObject({ error: undefined, pinning: { status: 'suspended', columns: saved } });
    expect(runtime.getSnapshot().total).toBeGreaterThanOrEqual(20);
    runtime.updateViewport(VIEWPORT);
    expect(widths(runtime)).toEqual({ left: 200, name: 700, right: 100 });
  });

  it('cancels a pin drag before switching context and restores the committed widths', () => {
    const runtime = createRuntime();
    runtime.beginPinResize('left', 200, 'right');
    runtime.moveResize(800);
    runtime.updateViewport({ ...VIEWPORT, container: 250, width: 250 });
    expect(runtime.getSnapshot().dragging).toBe(false);
    expect(runtime.getSnapshot().pinning).toMatchObject({
      status: 'suspended',
      columns: [
        { id: 'left', width: 200 },
        { id: 'right', width: 100 },
      ],
    });
    runtime.updateViewport(VIEWPORT);
    expect(widths(runtime)).toEqual({ left: 200, name: 700, right: 100 });
  });

  it('preserves cancel across a viewport rebase during pin resize', () => {
    const runtime = createRuntime();
    runtime.beginPinResize('right', 900, 'left');
    runtime.moveResize(800);
    runtime.updateViewport({ ...VIEWPORT, container: 1200, width: 1200 });
    runtime.rebaseResize(1000);
    runtime.moveResize(950);
    expect(widths(runtime).right).toBe(250);
    runtime.cancelResize();
    expect(widths(runtime)).toEqual({ left: 200, name: 900, right: 100 });
  });

  it('does not let a wide inherited surface or child demand enlarge pin budget', () => {
    const runtime = createRuntime(COLUMNS, OPTIONS, { ...VIEWPORT, container: 1600, available: 600, width: 600 });
    runtime.setNestedWidth('child', 2000);
    expect(runtime.getSnapshot()).toMatchObject({ total: 2000, pinning: { status: 'active' } });
    runtime.beginPinResize('left', 200, 'right');
    runtime.moveResize(2000);
    runtime.finishResize();
    expect(widths(runtime).left).toBe(450);
    expect(widths(runtime).right).toBe(100);
    expect(runtime.getSnapshot().columns.at(-1)?.displayOffset).toBe(500);
  });

  it('keeps committed pin and ordinary manual requests across neutral configure and reorder by id', () => {
    const columns = [fixed('left', 200, 'left'), auto('name', 100), fixed('code', 100), fixed('right', 100, 'right')];
    const runtime = createRuntime(columns);
    runtime.beginPinResize('left', 200, 'right');
    runtime.moveResize(300);
    runtime.finishResize();
    runtime.beginResize('name', 500);
    runtime.moveResize(900);
    runtime.finishResize();
    const saved = widths(runtime);
    runtime.configure(
      columns.map((column) => ({ ...column })),
      ['row', 'new'],
      ['new'],
      OPTIONS,
    );
    expect(widths(runtime)).toEqual(saved);
    runtime.configure([columns[3], columns[2], columns[1], columns[0]], ['row'], [], OPTIONS);
    expect(widths(runtime)).toEqual(saved);
    expect(runtime.getSnapshot().columns.map((column) => column.id)).toEqual(['left', 'code', 'name', 'right']);
  });

  it('does not move the grab origin during a neutral configure or nested constraint update', () => {
    const runtime = createRuntime();
    runtime.beginPinResize('left', 200, 'right');
    runtime.moveResize(400);
    runtime.configure(
      COLUMNS.map((column) => ({ ...column })),
      ['row'],
      [],
      OPTIONS,
    );
    runtime.setNestedWidth('child', 300);
    runtime.moveResize(100);
    expect(widths(runtime).left).toBe(100);
    runtime.cancelResize();
  });

  it('cancels on permission revocation and resets only changed declarations', () => {
    const runtime = createRuntime();
    runtime.beginPinResize('left', 200, 'right');
    runtime.moveResize(400);
    runtime.configure(
      COLUMNS.map((column) => ({ ...column, resizable: false })),
      ['row'],
      [],
      OPTIONS,
    );
    expect(runtime.getSnapshot().dragging).toBe(false);
    expect(widths(runtime).left).toBe(200);
    runtime.configure(COLUMNS, ['row'], [], OPTIONS);
    runtime.beginPinResize('right', 900, 'left');
    runtime.moveResize(800);
    runtime.finishResize();
    runtime.configure(
      COLUMNS.map((column) => (column.id === 'left' ? { ...column, width: 250 } : column)),
      ['row'],
      [],
      OPTIONS,
    );
    expect(widths(runtime).left).toBe(250);
    expect(widths(runtime).right).toBe(200);
  });

  it('invalidates measured cells on pin resize while retaining row identity and expansion', () => {
    const runtime = createRuntime(COLUMNS, { ...OPTIONS, expansion: true });
    runtime.toggleExpanded('row');
    const before = runtime.getSnapshot();
    runtime.beginPinResize('left', 200, 'right');
    runtime.moveResize(300);
    runtime.finishResize();
    expect(runtime.getSnapshot().version).toBeGreaterThan(before.version);
    runtime.commitMeasurements([{ rowId: 'row', columnId: 'name', height: 900, version: before.version }]);
    expect(runtime.getSnapshot().rows[0]).toMatchObject({ id: 'row', expanded: true, contentHeight: 40 });
  });

  it('rejects an infeasible pin drag result without throwing or corrupting the last valid center', () => {
    const runtime = createRuntime([fixed('left', 600, 'left'), { ...auto('name'), max: 400 }]);
    expect(widths(runtime)).toEqual({ left: 600, name: 400 });
    runtime.beginPinResize('left', 600, 'right');
    expect(() => runtime.moveResize(500)).not.toThrow();
    expect(widths(runtime)).toEqual({ left: 600, name: 400 });
    expect(runtime.getSnapshot()).toMatchObject({ error: undefined, dragging: true });
    runtime.moveResize(800);
    expect(widths(runtime)).toEqual({ left: 800, name: 200 });
    runtime.cancelResize();
    expect(widths(runtime)).toEqual({ left: 600, name: 400 });
  });

  it('does not commit an initialized pin batch when the resulting center cannot fill', () => {
    const runtime = createRuntime([
      fixed('left', 600, 'left'),
      { ...auto('name'), max: 0 },
      fixed('right', 600, 'right'),
    ]);
    expect(runtime.getSnapshot().error).toMatch(/fill/);
    expect(runtime.getSnapshot().pinning?.columns).toEqual([]);
    expect(runtime.getSnapshot().columns).toEqual([]);
  });

  it('ignores non-finite input and preserves the operation for a later valid move', () => {
    const runtime = createRuntime();
    expect(runtime.beginPinResize('left', NaN, 'right')).toBe(false);
    runtime.beginPinResize('left', 200, 'right');
    runtime.moveResize(NaN);
    runtime.moveResize(Infinity);
    runtime.rebaseResize(NaN);
    expect(widths(runtime).left).toBe(200);
    runtime.moveResize(250);
    expect(widths(runtime).left).toBe(250);
  });

  it('removes state for deleted ids and initializes a reintroduced declaration afresh', () => {
    const runtime = createRuntime();
    runtime.beginPinResize('left', 200, 'right');
    runtime.moveResize(500);
    runtime.finishResize();
    runtime.configure(
      COLUMNS.filter((column) => column.id !== 'left'),
      ['row'],
      [],
      OPTIONS,
    );
    expect(runtime.getSnapshot().pinning?.columns.map((column) => column.id)).toEqual(['right']);
    runtime.configure(COLUMNS, ['row'], [], OPTIONS);
    expect(widths(runtime).left).toBe(200);
  });

  it('initializes a newly declared fixed pin from its declaration after an ordinary resize', () => {
    const ordinary = COLUMNS.map((column) => ({ ...column, pin: undefined }));
    const runtime = createRuntime(ordinary);
    runtime.beginResize('left', 200);
    runtime.moveResize(500);
    runtime.finishResize();
    expect(widths(runtime).left).toBe(500);
    runtime.configure(COLUMNS, ['row'], [], OPTIONS);
    expect(widths(runtime).left).toBe(200);
    runtime.configure(ordinary, ['row'], [], OPTIONS);
    expect(widths(runtime).left).toBe(500);
  });

  it('fills a shared nested surface during center resize with active pins', () => {
    const runtime = createRuntime(
      [fixed('left', 100, 'left'), fixed('code', 200), auto('name', 100), fixed('right', 100, 'right')],
      OPTIONS,
      { ...VIEWPORT, container: 1600, available: 600, width: 600 },
    );
    runtime.beginResize('code', 300);
    runtime.moveResize(100);
    runtime.finishResize();
    expect(runtime.getSnapshot()).toMatchObject({ total: 1600, error: undefined, pinning: { status: 'active' } });
    expect(widths(runtime)).toEqual({ left: 100, code: 0, name: 1400, right: 100 });
  });

  it('reports invalid input rather than treating every RangeError as a budget fallback', () => {
    const runtime = createRuntime(COLUMNS.map((column) => (column.pin ? { ...column, floor: -1 } : column)));
    expect(runtime.getSnapshot().error).toMatch(/minWidth/);
    const invalidViewport = createRuntime(COLUMNS, OPTIONS, { ...VIEWPORT, width: NaN });
    expect(invalidViewport.getSnapshot().error).toMatch(/viewport width/);
  });
});

it('keeps pin widths stable across 800 seeded resize, projection and fallback transitions', () => {
  let seed = 161803;
  const random = () => (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296;
  for (let scenario = 0; scenario < 80; scenario++) {
    const runtime = createRuntime();
    for (let step = 0; step < 10; step++) {
      const right = random() > 0.5;
      const id = right ? 'right' : 'left';
      const edge = right ? 'left' : 'right';
      const other = right ? 'left' : 'right';
      const before = widths(runtime);
      const x = right ? 1000 - before.right : before.left;
      if (runtime.beginPinResize(id, x, edge)) {
        runtime.moveResize(x + (random() - 0.5) * 1600);
        runtime.finishResize();
      }
      expect(runtime.getSnapshot().error).toBeUndefined();
      expect(widths(runtime)[other]).toBe(before[other]);
      const saved = runtime.getSnapshot().pinning!.columns;
      expect(saved.reduce((sum, pin) => sum + pin.width, 0)).toBeLessThanOrEqual(950 + 1e-7);
      const active = widths(runtime);
      const version = runtime.getSnapshot().version;
      runtime.updateViewport({ ...VIEWPORT, left: random() * 1000 });
      expect(widths(runtime)).toEqual(active);
      expect(runtime.getSnapshot().version).toBe(version);
      runtime.updateViewport({ ...VIEWPORT, container: 20, width: 20 });
      expect(runtime.getSnapshot()).toMatchObject({
        error: undefined,
        dragging: false,
        pinning: { status: 'suspended', columns: saved },
      });
      runtime.updateViewport(VIEWPORT);
      expect(runtime.getSnapshot().pinning?.status).toBe('active');
      expect(widths(runtime)).toEqual(active);
    }
  }
});
