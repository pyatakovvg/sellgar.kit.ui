import { describe, expect, it } from 'vitest';

import { TableRuntime } from '../table-runtime';
import { createGeometryColumns } from '../../core/layout/create-columns';

import type { GeometryColumn } from '../../core/layout/types';

const columns: GeometryColumn[] = [
  { id: 'name', mode: 'auto', width: 0, floor: 200, max: Infinity, resizable: true },
  { id: 'price', mode: 'fixed', width: 160, floor: 0, max: Infinity, resizable: true, measureContent: true },
  { id: 'stock', mode: 'fixed', width: 140, floor: 0, max: Infinity, measureContent: true },
];
const options = { rowHeight: 40, minRowHeight: 32, overscan: 3, virtual: true, sticky: true };
const create = (schema = columns) => {
  const runtime = new TableRuntime();
  runtime.configure(schema, ['row'], [], options);
  runtime.updateViewport({
    container: 661,
    width: 661,
    height: 300,
    scroll: 0,
    left: 0,
    top: 0,
    screenLeft: 0,
    scale: 1,
  });
  runtime.beginResize('name', 0);
  runtime.moveResize(300);
  runtime.finishResize();
  return runtime;
};
const measure = (runtime: TableRuntime, width: number) =>
  runtime.commitContentWidths([{ columnId: 'price', width }], runtime.getSnapshot().contentEpoch);
const shrink = (runtime: TableRuntime) => {
  expect(runtime.beginResize('price', 0)).toBe(true);
  runtime.moveResize(-10000);
  runtime.finishResize();
  return runtime.getSnapshot().widths[1];
};

describe('Default content minimum', () => {
  it('keeps a fixed column and its handle reachable after manual auto expansion', () => {
    const runtime = create();
    measure(runtime, 87.5);
    measure(runtime, 72);
    expect(shrink(runtime)).toBe(87.5);
    expect(runtime.getSnapshot().columns.find((column) => column.id === 'price')).toMatchObject({
      left: false,
      right: true,
    });
    runtime.beginResize('price', 0);
    runtime.moveResize(20);
    runtime.finishResize();
    expect(runtime.getSnapshot().widths[1]).toBe(107.5);
    expect(shrink(runtime)).toBe(87.5);
  });

  it('allows measured content to exceed the initially declared width', () => {
    const runtime = create();
    measure(runtime, 5000);
    expect(shrink(runtime)).toBe(5000);
  });

  it('uses the measured minimum for independent right-pin resize', () => {
    const runtime = create(
      columns.map((column) => (column.id === 'price' ? { ...column, pin: 'right' as const } : column)),
    );
    measure(runtime, 88);
    expect(runtime.beginPinResize('price', 0, 'left')).toBe(true);
    runtime.moveResize(1000);
    runtime.finishResize();
    expect(runtime.getSnapshot().columns.find((column) => column.id === 'price')).toMatchObject({
      width: 88,
      left: true,
      right: false,
    });
  });

  it('retains a hard geometry floor alongside measured content', () => {
    const runtime = create(columns.map((column) => (column.id === 'price' ? { ...column, floor: 100 } : column)));
    measure(runtime, 80);
    expect(shrink(runtime)).toBe(100);
    measure(runtime, 140);
    expect(shrink(runtime)).toBe(140);
  });

  it.each(['finish', 'cancel'] as const)('defers new content limits until drag %s', (end) => {
    const runtime = create();
    measure(runtime, 80);
    runtime.beginResize('price', 0);
    runtime.moveResize(-1000);
    measure(runtime, 120);
    expect(runtime.getSnapshot().widths[1]).toBe(80);
    runtime.moveResize(-900);
    expect(runtime.getSnapshot().widths[1]).toBe(80);
    if (end === 'finish') runtime.finishResize();
    else runtime.cancelResize();
    expect(shrink(runtime)).toBe(120);
  });

  it('retains observed limits through ordinary configure and replaces them when data changes', () => {
    const runtime = create();
    measure(runtime, 100);
    const epoch = runtime.getSnapshot().contentEpoch;
    runtime.configure(columns, ['row'], [], options);
    expect(runtime.getSnapshot().contentEpoch).toBe(epoch);
    expect(shrink(runtime)).toBe(100);
    runtime.configure(columns, ['replacement'], [], options);
    runtime.commitContentWidths([{ columnId: 'price', width: 150 }], epoch);
    measure(runtime, 60);
    expect(shrink(runtime)).toBe(60);
  });

  it('rejects invalid measurements without installing a new floor', () => {
    const runtime = create();
    expect(() => measure(runtime, NaN)).toThrow(/finite/);
    measure(runtime, 80);
    expect(shrink(runtime)).toBe(80);
  });
});

describe('Auto content minimum and overflow', () => {
  const createAutomatic = (minimum?: number, maximum = Infinity) => {
    const runtime = new TableRuntime();
    runtime.configure(
      createGeometryColumns([
        { columnId: 'label', sourceIndex: 0 },
        { columnId: 'balance', sourceIndex: 1, minWidth: minimum, maxWidth: maximum, resizable: true },
        { columnId: 'status', sourceIndex: 2 },
      ]),
      ['row'],
      [],
      options,
    );
    runtime.updateViewport({
      container: 300,
      width: 300,
      height: 300,
      scroll: 0,
      left: 0,
      top: 0,
      screenLeft: 0,
      scale: 1,
    });
    return runtime;
  };
  const measureBalance = (runtime: TableRuntime, width: number) =>
    runtime.commitContentWidths([{ columnId: 'balance', width }], runtime.getSnapshot().contentEpoch);

  it('grows beyond the initial auto share and overflows the viewport when content requires it', () => {
    const runtime = createAutomatic();
    expect(runtime.getSnapshot().widths[1]).toBe(100);
    measureBalance(runtime, 420);
    expect(runtime.getSnapshot().widths[1]).toBeGreaterThanOrEqual(420);
    expect(runtime.getSnapshot().total).toBeGreaterThan(300);
  });

  it.each([0, 100])('measures content above explicit minimum %s', (minimum) => {
    const runtime = createAutomatic(minimum);
    measureBalance(runtime, 140);
    expect(runtime.getSnapshot().widths[1]).toBeGreaterThanOrEqual(140);
    expect(runtime.beginResize('balance', 0)).toBe(true);
    runtime.moveResize(-1000);
    runtime.finishResize();
    expect(runtime.getSnapshot().widths[1]).toBe(minimum);
    runtime.resetColumnWidth('balance');
    expect(runtime.getSnapshot().widths[1]).toBeGreaterThanOrEqual(140);
  });

  it('keeps explicit minWidth when measured content is narrower', () => {
    const runtime = createAutomatic(180);
    measureBalance(runtime, 80);
    expect(runtime.getSnapshot().widths[1]).toBeGreaterThanOrEqual(180);
  });

  it('retains the explicit maximum when content is wider', () => {
    const runtime = createAutomatic(100, 180);
    measureBalance(runtime, 420);
    expect(runtime.getSnapshot().widths[1]).toBe(180);
    expect(runtime.getSnapshot().error).toBeUndefined();
  });
});

describe('Declared column widths', () => {
  const definitions = (width?: number, minWidth?: number, maxWidth?: number) =>
    createGeometryColumns([
      { columnId: 'name', sourceIndex: 0, minWidth: 200 },
      { columnId: 'price', sourceIndex: 1, width, minWidth, maxWidth, resizable: true },
      { columnId: 'stock', sourceIndex: 2, width: 140 },
    ]);

  it.each([
    { width: 0, minimum: undefined, maximum: undefined, expected: 0 },
    { width: 120, minimum: undefined, maximum: undefined, expected: 120 },
    { width: 120, minimum: 160, maximum: undefined, expected: 160 },
    { width: 120, minimum: undefined, maximum: 80, expected: 80 },
  ])('preserves width $width within explicit constraints after content measurement', (sample) => {
    const runtime = create(definitions(sample.width, sample.minimum, sample.maximum));
    measure(runtime, 5000);
    expect(runtime.getSnapshot().widths[1]).toBe(sample.expected);
  });

  it('still measures content when width is omitted', () => {
    const runtime = create(definitions());
    measure(runtime, 5000);
    expect(runtime.getSnapshot().widths[1]).toBeGreaterThanOrEqual(5000);
  });

  it.each([
    { minimum: undefined, expected: 120 },
    { minimum: 0, expected: 0 },
    { minimum: 40, expected: 40 },
  ])('uses the declared width as the resize minimum unless minWidth is $minimum', (sample) => {
    const runtime = create(definitions(120, sample.minimum));
    measure(runtime, 5000);
    expect(shrink(runtime)).toBe(sample.expected);
  });

  it('allows manual resize below content width and resets to the declaration', () => {
    const runtime = create(definitions(120, 40));
    measure(runtime, 5000);
    expect(shrink(runtime)).toBe(40);
    expect(runtime.beginResize('price', 0)).toBe(true);
    runtime.moveResize(40);
    runtime.finishResize();
    expect(runtime.getSnapshot().widths[1]).toBe(80);
    runtime.resetColumnWidth('price');
    expect(runtime.getSnapshot().widths[1]).toBe(120);
  });

  it.each([0, 120])('sizes auto from content but allows resizing down to explicit minWidth %s', (minimum) => {
    const schema = definitions(undefined, minimum);
    const runtime = create(schema);
    measure(runtime, 5000);
    expect(runtime.getSnapshot().widths[1]).toBeGreaterThanOrEqual(5000);
    expect(shrink(runtime)).toBe(minimum);
    runtime.configure(schema, ['row'], [], options);
    expect(runtime.getSnapshot().widths[1]).toBe(minimum);
    measure(runtime, 9000);
    expect(runtime.getSnapshot().widths[1]).toBe(minimum);
    runtime.resetColumnWidth('price');
    expect(runtime.getSnapshot().widths[1]).toBeGreaterThanOrEqual(9000);
  });

  it('restores automatic sizing when resize is cancelled', () => {
    const runtime = create(definitions(undefined, 120));
    measure(runtime, 5000);
    const initial = runtime.getSnapshot().widths[1];
    expect(runtime.beginResize('price', 0)).toBe(true);
    runtime.moveResize(-10000);
    expect(runtime.getSnapshot().widths[1]).toBe(120);
    runtime.cancelResize();
    expect(runtime.getSnapshot().widths[1]).toBe(initial);
    measure(runtime, 9000);
    expect(runtime.getSnapshot().widths[1]).toBeGreaterThanOrEqual(9000);
  });

  it.each(['left', 'right'] as const)('allows an auto %s pin to shrink to its explicit minWidth', (side) => {
    const schema = definitions(undefined, 120).map((column) =>
      column.id === 'price' ? { ...column, pin: side } : column,
    );
    const runtime = create(schema);
    measure(runtime, 420);
    expect(runtime.getSnapshot().columns.find((column) => column.id === 'price')?.width).toBeGreaterThanOrEqual(420);
    expect(runtime.beginPinResize('price', 0, side === 'left' ? 'right' : 'left')).toBe(true);
    runtime.moveResize(side === 'left' ? -1000 : 1000);
    runtime.finishResize();
    expect(runtime.getSnapshot().columns.find((column) => column.id === 'price')?.width).toBe(120);
    measure(runtime, 500);
    expect(runtime.getSnapshot().columns.find((column) => column.id === 'price')?.width).toBe(120);
    runtime.resetColumnWidth('price');
    expect(runtime.getSnapshot().columns.find((column) => column.id === 'price')?.width).toBeGreaterThanOrEqual(500);
  });

  it('clears the automatic content floor when a width is supplied', () => {
    const runtime = create(definitions());
    measure(runtime, 5000);
    runtime.configure(definitions(120), ['row'], [], options);
    expect(runtime.getSnapshot().widths[1]).toBe(120);
  });

  it.each(['left', 'right'] as const)('preserves the explicit width of a %s pin', (side) => {
    const schema = definitions(120).map((column) => (column.id === 'price' ? { ...column, pin: side } : column));
    const runtime = create(schema);
    measure(runtime, 5000);
    expect(runtime.getSnapshot().columns.find((column) => column.id === 'price')?.width).toBe(120);
    expect(runtime.beginPinResize('price', 0, side === 'left' ? 'right' : 'left')).toBe(true);
    runtime.moveResize(side === 'left' ? -1000 : 1000);
    runtime.finishResize();
    expect(runtime.getSnapshot().columns.find((column) => column.id === 'price')?.width).toBe(120);
  });
});
