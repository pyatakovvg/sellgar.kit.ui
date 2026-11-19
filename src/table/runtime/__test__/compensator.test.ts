import { describe, expect, it } from 'vitest';

import { TABLE_COMPENSATOR_COLUMN_ID } from '../../core/column';
import { result } from '../../core/layout/column-layout';
import { TableRuntime } from '../table-runtime';

import type { GeometryColumn } from '../../core/layout/types';

const OPTIONS = { rowHeight: 40, minRowHeight: 32, overscan: 2, virtual: false, sticky: true };
const VIEWPORT = { container: 500, width: 500, height: 400, scroll: 0, left: 0, top: 0, screenLeft: 0, scale: 1 };
const fixed = (id: string, width: number, pin?: 'left' | 'right'): GeometryColumn => ({
  id,
  mode: 'fixed',
  width,
  floor: 50,
  max: Infinity,
  resizable: true,
  ...(pin ? { pin } : {}),
});
const auto: GeometryColumn = { id: 'auto', mode: 'auto', width: 0, floor: 50, max: Infinity, resizable: true };
const create = (columns: GeometryColumn[]) => {
  const runtime = new TableRuntime();
  runtime.configure(columns, ['row'], [], OPTIONS);
  runtime.updateViewport(VIEWPORT);
  return runtime;
};
const resize = (runtime: TableRuntime, id: string, delta: number) => {
  expect(runtime.beginResize(id, 0)).toBe(true);
  runtime.moveResize(delta);
  runtime.finishResize();
};

describe('Internal trailing compensator', () => {
  it('does not mutate supplied base or actual arrays when filling the remainder', () => {
    const columns: GeometryColumn[] = [
      fixed('a', 100),
      { ...auto, id: TABLE_COMPENSATOR_COLUMN_ID, floor: 0, compensator: true },
    ];
    const base = [100, 0];
    const actual = [100, 0];
    Object.freeze(base);
    Object.freeze(actual);
    expect(result(columns, 500, base, actual).widths).toEqual([100, 400]);
    expect(base).toEqual([100, 0]);
    expect(actual).toEqual([100, 0]);
  });
  it('fills fixed-only tables and collapses to zero in overflow', () => {
    const runtime = create([fixed('a', 100), fixed('b', 100)]);
    expect(runtime.getSnapshot().widths).toEqual([100, 100, 300]);
    expect(runtime.getColumnWidth(TABLE_COMPENSATOR_COLUMN_ID)).toBe(300);
    runtime.updateViewport({ ...VIEWPORT, container: 150, width: 150 });
    expect(runtime.getSnapshot().widths).toEqual([100, 100]);
    expect(runtime.getColumnWidth(TABLE_COMPENSATOR_COLUMN_ID)).toBe(0);
    expect(runtime.getSnapshot().error).toBeUndefined();
  });

  it('lets user auto columns take the space first', () => {
    const runtime = create([fixed('a', 100), auto]);
    expect(runtime.getSnapshot().widths).toEqual([100, 400]);
    expect(runtime.getColumnWidth(TABLE_COMPENSATOR_COLUMN_ID)).toBe(0);
    expect(runtime.getSnapshot().columnCount).toBe(2);
    expect(runtime.getSnapshot().columns.every((column) => !column.compensator)).toBe(true);
  });

  it('takes over when the only auto disappears and yields when it returns', () => {
    const columns = [fixed('a', 100), fixed('b', 100), auto];
    const runtime = create(columns);
    resize(runtime, 'a', 30);
    runtime.configure(columns.slice(0, 2), ['row'], [], OPTIONS);
    expect(runtime.getSnapshot().widths).toEqual([130, 100, 270]);
    runtime.configure(columns, ['row'], [], OPTIONS);
    expect(runtime.getSnapshot().widths).toEqual([130, 100, 270]);
    expect(runtime.getColumnWidth(TABLE_COMPENSATOR_COLUMN_ID)).toBe(0);
  });

  it('keeps the last handle enabled when the compensator reaches zero and supports reset', () => {
    const runtime = create([fixed('a', 200), fixed('last', 300)]);
    expect(runtime.getSnapshot().columns.at(-1)?.resizable).toBe(true);
    resize(runtime, 'last', -80);
    expect(runtime.getSnapshot().widths).toEqual([200, 220, 80]);
    resize(runtime, 'last', 80);
    expect(runtime.getSnapshot().widths).toEqual([200, 300]);
    expect(runtime.getSnapshot().columns.at(-1)?.resizable).toBe(true);
    resize(runtime, 'last', -80);
    expect(runtime.resetColumnWidth('last')).toBe(true);
    expect(runtime.getSnapshot().widths).toEqual([200, 300]);
    expect(runtime.beginResize(TABLE_COMPENSATOR_COLUMN_ID, 0)).toBe(false);
  });

  it('allows auto shrinking to its floor without underfill and retains it on neutral updates', () => {
    const runtime = create([fixed('a', 100), auto]);
    resize(runtime, 'auto', -100);
    expect(runtime.getSnapshot().widths).toEqual([100, 300, 100]);
    runtime.configure([fixed('a', 100), auto], ['row'], ['row'], OPTIONS);
    expect(runtime.getSnapshot().widths).toEqual([100, 300, 100]);
    runtime.updateViewport({ ...VIEWPORT, container: 450, width: 450 });
    expect(runtime.getSnapshot().widths).toEqual([100, 300, 50]);
    runtime.updateViewport(VIEWPORT);
    expect(runtime.getSnapshot().widths).toEqual([100, 300, 100]);
    runtime.resetColumnWidth('auto');
    expect(runtime.getSnapshot().widths).toEqual([100, 400]);
  });

  it('places the compensator in the center before right pins', () => {
    const runtime = create([fixed('left', 100, 'left'), fixed('center', 100), fixed('right', 100, 'right')]);
    expect(runtime.getSnapshot().error).toBeUndefined();
    expect(runtime.getSnapshot().columns.map((column) => [column.id, column.region, column.width])).toEqual([
      ['left', 'left', 100],
      ['center', 'center', 100],
      [TABLE_COMPENSATOR_COLUMN_ID, 'center', 200],
      ['right', 'right', 100],
    ]);
    expect(runtime.getSnapshot().columns.at(-1)?.index).toBe(3);
    resize(runtime, 'center', 200);
    expect(runtime.getSnapshot().columns.at(-1)).toMatchObject({ id: 'right', index: 2 });
    expect(runtime.getSnapshot().widths).toEqual([100, 300, 100]);
  });

  it('fills a shared nested surface without increasing the child demand', () => {
    const runtime = create([fixed('a', 100), fixed('b', 100)]);
    runtime.updateViewport({ ...VIEWPORT, container: 800, available: 500 });
    expect(runtime.getSnapshot()).toMatchObject({ widths: [100, 100, 600], minimumWidth: 200, total: 800 });
    const compensator = runtime.getSnapshot().columns.find((column) => column.compensator)!;
    expect(compensator).toMatchObject({ resizable: false, measureContent: false });
    runtime.commitContentWidths([{ columnId: compensator.id, width: 10000 }], runtime.getSnapshot().contentEpoch);
    expect(runtime.getSnapshot().minimumWidth).toBe(200);
  });

  it('keeps finite widths, declared bounds and full coverage across mixed resize and schema transitions', () => {
    let seed = 90210;
    const random = () => (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296;
    for (let scenario = 0; scenario < 40; scenario++) {
      const columns = [fixed('a', 100), fixed('b', 150), { ...auto, max: 300 }];
      const runtime = create(columns);
      let visible = columns;
      let width = 500;
      for (let step = 0; step < 30; step++) {
        const action = Math.floor(random() * 4);
        if (action === 0) {
          visible = visible.length === 3 ? columns.slice(0, 2) : columns;
          runtime.configure(visible, ['row'], [], OPTIONS);
        } else if (action === 1) {
          width = 100 + random() * 700;
          runtime.updateViewport({ ...VIEWPORT, width, container: width });
        } else {
          const column = visible[Math.floor(random() * visible.length)];
          const before = runtime.getSnapshot().widths.slice();
          if (runtime.beginResize(column.id, 0)) {
            runtime.moveResize((random() - 0.5) * 1200);
            if (action === 2) runtime.finishResize();
            else {
              runtime.cancelResize();
              expect(runtime.getSnapshot().widths).toEqual(before);
            }
          }
        }
        const snapshot = runtime.getSnapshot();
        expect(snapshot.error).toBeUndefined();
        expect(snapshot.total).toBeGreaterThanOrEqual(width - 1e-7);
        let sum = 0;
        for (const column of visible) {
          const actual = runtime.getColumnWidth(column.id)!;
          expect(Number.isFinite(actual)).toBe(true);
          expect(actual).toBeGreaterThanOrEqual(column.floor - 1e-7);
          expect(actual).toBeLessThanOrEqual(column.max + 1e-7);
          sum += actual;
        }
        expect(runtime.getColumnWidth(TABLE_COMPENSATOR_COLUMN_ID)).toBeCloseTo(Math.max(0, width - sum), 6);
      }
    }
  });
});
