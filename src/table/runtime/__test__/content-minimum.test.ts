import { describe, expect, it } from 'vitest';

import { TableRuntime } from '../table-runtime';

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
  runtime.moveResize(-1000);
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

  it('caps the inferred floor at the declared reference width', () => {
    const runtime = create();
    measure(runtime, 5000);
    expect(shrink(runtime)).toBe(160);
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

  it('preserves explicit minWidth instead of replacing it with content', () => {
    const runtime = create(
      columns.map((column) => (column.id === 'price' ? { ...column, floor: 20, measureContent: false } : column)),
    );
    measure(runtime, 120);
    expect(shrink(runtime)).toBe(20);
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
