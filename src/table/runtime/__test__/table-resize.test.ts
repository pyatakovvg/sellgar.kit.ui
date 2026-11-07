import { describe, expect, it } from 'vitest';

import { TableRuntime } from '../table-runtime';

import type { TableViewport } from '../types';

const VIEWPORT: TableViewport = {
  container: 1000,
  width: 1000,
  height: 520,
  scroll: 0,
  left: 0,
  top: 0,
  screenLeft: 0,
  scale: 1,
};
const OPTIONS = { rowHeight: 40, minRowHeight: 32, overscan: 3, virtual: true, sticky: true };

const createRuntime = (max = Infinity) => {
  const runtime = new TableRuntime();
  runtime.configure(
    [
      { id: 'description', mode: 'auto', resizable: true, width: 0, floor: 0, max },
      { id: 'brand', mode: 'auto', resizable: true, width: 0, floor: 0, max: Infinity },
    ],
    ['product'],
    [],
    OPTIONS,
  );
  runtime.updateViewport(VIEWPORT);
  return runtime;
};

describe('Table resize grab point', () => {
  it('does not turn a manual auto width into its minimum after resizing a fixed column to its left', () => {
    const runtime = new TableRuntime();
    runtime.configure(
      [
        { id: 'article', mode: 'fixed', resizable: true, width: 220, floor: 0, max: Infinity },
        { id: 'details', mode: 'auto', resizable: true, width: 0, floor: 0, max: Infinity },
        { id: 'inventory', mode: 'fixed', resizable: true, width: 340, floor: 0, max: Infinity },
      ],
      ['record'],
      [],
      OPTIONS,
    );
    runtime.updateViewport({ ...VIEWPORT, container: 610, width: 610 });
    runtime.beginResize('details', 270);
    runtime.moveResize(370);
    runtime.finishResize();
    expect(runtime.getSnapshot().widths).toEqual([220, 150, 340]);
    runtime.beginResize('article', 220);
    runtime.moveResize(320);
    runtime.finishResize();
    runtime.beginResize('article', 320);
    runtime.moveResize(220);
    runtime.finishResize();
    runtime.beginResize('details', 370);
    runtime.moveResize(270);
    runtime.finishResize();
    expect(runtime.getSnapshot().widths).toEqual([220, 50, 340]);
  });
  it('waits for the cursor to return to the handle after crossing minimum in one held drag', () => {
    const runtime = createRuntime();
    expect(runtime.beginResize('description', 486)).toBe(true);
    const widths = [];

    for (const cursor of [686, 286, 306, 466, 486, 506]) {
      runtime.moveResize(cursor);
      const state = runtime.getSnapshot();
      widths.push(state.widths[0]);
      expect(state.dragging).toBe(true);
      expect(state.total).toBeGreaterThanOrEqual(VIEWPORT.container);
    }

    expect(widths).toEqual([700, 500, 500, 500, 500, 520]);
    runtime.finishResize();
    expect(runtime.getSnapshot().dragging).toBe(false);
  });

  it('waits for the cursor to return from beyond maximum before shrinking', () => {
    const runtime = createRuntime(700);
    runtime.beginResize('description', 486);
    const widths = [];

    for (const cursor of [886, 866, 706, 686, 666]) {
      runtime.moveResize(cursor);
      widths.push(runtime.getSnapshot().widths[0]);
    }

    expect(widths).toEqual([700, 700, 700, 700, 680]);
  });

  it.each([2, 14, 26])('preserves a grab offset of %s pixels through repeated reversals', (offset) => {
    const runtime = createRuntime(700);
    runtime.beginResize('description', 500 - offset);
    const widths = [];

    for (const boundary of [700, 300, 320, 480, 500, 520, 900, 880, 720, 700, 680]) {
      runtime.moveResize(boundary - offset);
      widths.push(runtime.getSnapshot().widths[0]);
    }

    expect(widths).toEqual([700, 500, 500, 500, 500, 520, 700, 700, 700, 700, 680]);
  });

  it('keeps attachment when the minimum is imposed by right-side capacity and restores on cancellation', () => {
    const runtime = new TableRuntime();
    runtime.configure(
      [
        { id: 'description', mode: 'fixed', resizable: true, width: 400, floor: 60, max: 1400 },
        { id: 'brand', mode: 'auto', resizable: true, width: 0, floor: 200, max: 650 },
      ],
      ['product'],
      [],
      OPTIONS,
    );
    runtime.updateViewport(VIEWPORT);
    runtime.beginResize('description', 386);
    const widths = [];

    for (const cursor of [686, 186, 206, 316, 336, 356]) {
      runtime.moveResize(cursor);
      widths.push([...runtime.getSnapshot().widths]);
      expect(runtime.getSnapshot().total).toBeGreaterThanOrEqual(VIEWPORT.container);
    }

    expect(widths).toEqual([
      [700, 300],
      [350, 650],
      [350, 650],
      [350, 650],
      [350, 650],
      [370, 630],
    ]);
    runtime.cancelResize();
    expect(runtime.getSnapshot().widths).toEqual([400, 600]);
  });

  it('accepts coordinates corrected for horizontal scroll without resetting the grab', () => {
    const runtime = createRuntime();
    runtime.beginResize('description', 486);
    runtime.moveResize(686);
    runtime.updateViewport({ ...VIEWPORT, left: 100 });
    runtime.moveResize(686 + 100);
    expect(runtime.getSnapshot().widths[0]).toBe(800);
    runtime.moveResize(286 + 100);
    runtime.moveResize(306 + 100);
    expect(runtime.getSnapshot().widths[0]).toBe(500);
    runtime.moveResize(406 + 100);
    expect(runtime.getSnapshot().widths[0]).toBe(520);
  });

  it('keeps the grab point in table coordinates for a column after an unchanged prefix', () => {
    const runtime = new TableRuntime();
    runtime.configure(
      [
        { id: 'code', mode: 'fixed', resizable: true, width: 200, floor: 200, max: 200 },
        { id: 'description', mode: 'auto', resizable: true, width: 0, floor: 0, max: Infinity },
        { id: 'brand', mode: 'fixed', resizable: true, width: 200, floor: 200, max: 200 },
      ],
      ['product'],
      [],
      OPTIONS,
    );
    runtime.updateViewport(VIEWPORT);
    runtime.beginResize('description', 786);
    const widths = [];

    for (const cursor of [986, 586, 606, 786, 806]) {
      runtime.moveResize(cursor);
      widths.push([...runtime.getSnapshot().widths]);
    }

    expect(widths).toEqual([
      [200, 800, 200],
      [200, 600, 200],
      [200, 600, 200],
      [200, 600, 200],
      [200, 620, 200],
    ]);
  });
});
