import { describe, expect, it } from 'vitest';

import { TableRuntime } from '../table-runtime';
import { TableBrowser } from '../browser/table-browser';

import type { GeometryColumn } from '../../core/layout/types';
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
      { id: 'description', mode: 'auto', resizable: true, width: 0, floor: 500, max },
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

  it('keeps attachment when the declared minimum is reached and restores on cancellation', () => {
    const runtime = new TableRuntime();
    runtime.configure(
      [
        { id: 'description', mode: 'fixed', resizable: true, width: 400, floor: 350, max: 1400 },
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
        { id: 'description', mode: 'auto', resizable: true, width: 0, floor: 600, max: Infinity },
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

describe('Directed resize stability', () => {
  const directed = () => {
    const runtime = new TableRuntime();
    const columns: GeometryColumn[] = ['a', 'b', 'c', 'd'].map((id, i) => ({
      id,
      mode: i % 2 ? 'auto' : 'fixed',
      width: i % 2 ? 0 : 100,
      floor: 0,
      max: Infinity,
      resizable: true,
    }));
    runtime.configure(columns, ['row'], [], OPTIONS);
    runtime.updateViewport(VIEWPORT);
    runtime.beginResize('c', 0);
    runtime.moveResize(200);
    runtime.finishResize();
    expect(runtime.getSnapshot().widths).toEqual([100, 400, 300, 200]);
    return runtime;
  };

  it('leaves all columns unchanged at zero pointer delta and applies only the directed change', () => {
    const runtime = directed();
    runtime.beginResize('a', 0);
    runtime.moveResize(0);
    expect(runtime.getSnapshot().widths).toEqual([100, 400, 300, 200]);
    runtime.moveResize(40);
    expect(runtime.getSnapshot().widths).toEqual([140, 380, 300, 180]);
    runtime.moveResize(0);
    expect(runtime.getSnapshot().widths).toEqual([100, 400, 300, 200]);
  });

  it('retains individual directed bases on neutral reflow and a container round trip', () => {
    const runtime = directed();
    runtime.setNestedWidth('child', 10);
    expect(runtime.getSnapshot().widths).toEqual([100, 400, 300, 200]);
    runtime.updateViewport({ ...VIEWPORT, container: 1200, width: 1200 });
    runtime.updateViewport(VIEWPORT);
    expect(runtime.getSnapshot().widths).toEqual([100, 400, 300, 200]);
  });
});

describe('Keyboard resize commands', () => {
  it('uses the same limits and permissions as pointer resizing', () => {
    const runtime = createRuntime(505);
    const browser = new TableBrowser(runtime);
    browser.resizeBy('description', 10);
    expect(runtime.getSnapshot()).toMatchObject({ widths: [505, 500], dragging: false });
    browser.resizeBy('description', -10);
    expect(runtime.getSnapshot().widths).toEqual([500, 500]);
    browser.resizeBy('brand', 10);
    expect(runtime.getSnapshot().widths).toEqual([500, 500]);
  });
});

describe('Resize audit regressions', () => {
  it.each([
    [412.625, 110.125, 410.875],
    [429.5, 108.375, 412.625],
  ])('fills with the compensator below the old fill boundary after fixed shrink (%s, %s)', (manual, fixed, minimum) => {
    const runtime = new TableRuntime();
    runtime.configure(
      [
        { id: 'name', mode: 'auto', width: 0, floor: 200, max: Infinity, resizable: true },
        { id: 'price', mode: 'fixed', width: 160, floor: 0, max: Infinity, resizable: true },
        { id: 'stock', mode: 'fixed', width: 140, floor: 0, max: Infinity },
      ],
      ['row'],
      [],
      OPTIONS,
    );
    runtime.updateViewport({ ...VIEWPORT, container: 661, width: 661 });
    runtime.beginResize('name', 0);
    runtime.moveResize(manual - 361);
    runtime.finishResize();
    runtime.beginResize('price', 0);
    runtime.moveResize(fixed - 160);
    runtime.finishResize();
    expect(runtime.getSnapshot().widths).toEqual([manual, fixed, 140]);
    expect(runtime.getSnapshot().columns[0].left).toBe(true);

    expect(runtime.beginResize('name', 0)).toBe(true);
    for (const pointer of [-100, -60, minimum - manual, -1000]) {
      expect(() => runtime.moveResize(pointer)).not.toThrow();
      const width = Math.max(200, manual + pointer);
      const free = Math.max(0, 661 - width - fixed - 140);
      expect(runtime.getSnapshot()).toMatchObject({
        widths: [width, fixed, 140, ...(free > 0 ? [free] : [])],
        total: 661,
        dragging: true,
      });
      expect(runtime.getSnapshot().columns[0].left).toBe(width > 200);
    }
    runtime.cancelResize();
    expect(runtime.getSnapshot().widths).toEqual([manual, fixed, 140]);

    new TableBrowser(runtime).resizeBy('name', -1000);
    expect(runtime.getSnapshot()).toMatchObject({
      widths: [200, fixed, 140, 321 - fixed],
      total: 661,
      dragging: false,
    });
    expect(runtime.getSnapshot().columns[0].left).toBe(false);
  });

  it('keeps actual widths above their bases and allows manual auto to return after fixed growth', () => {
    const runtime = new TableRuntime();
    const columns: GeometryColumn[] = [
      { id: 'fixed', mode: 'fixed', width: 100, floor: 0, max: Infinity, resizable: true },
      { id: 'manual', mode: 'auto', width: 0, floor: 350, max: Infinity, resizable: true },
      { id: 'tail', mode: 'auto', width: 0, floor: 0, max: Infinity },
    ];
    runtime.configure(columns, ['row'], [], OPTIONS);
    runtime.updateViewport(VIEWPORT);
    runtime.beginResize('manual', 0);
    runtime.moveResize(350);
    runtime.finishResize();
    runtime.beginResize('fixed', 0);
    runtime.moveResize(200);
    runtime.finishResize();
    const before = runtime.getSnapshot().widths;
    expect(before).toEqual([300, 800, 350]);
    runtime.setNestedWidth('tiny', 1);
    expect(runtime.getSnapshot().widths).toEqual(before);
    runtime.beginResize('manual', 0);
    expect(() => runtime.moveResize(-1000)).not.toThrow();
    runtime.finishResize();
    expect(runtime.getSnapshot().widths).toEqual([300, 350, 350]);
  });

  it('preserves a masked manual request when there is no horizontal intent', () => {
    const runtime = createRuntime();
    runtime.beginResize('description', 0);
    runtime.moveResize(100);
    runtime.finishResize();
    runtime.updateViewport({ ...VIEWPORT, container: 1200, width: 1200 });
    runtime.beginResize('description', 0);
    runtime.moveResize(0);
    runtime.finishResize();
    runtime.updateViewport(VIEWPORT);
    expect(runtime.getSnapshot().widths).toEqual([600, 500]);
  });

  it('rebases a held drag after the container changes and cancels to the pre-drag state at the new size', () => {
    const runtime = createRuntime();
    runtime.beginResize('description', 100);
    runtime.updateViewport({ ...VIEWPORT, container: 1200, width: 1200 });
    expect(() => runtime.moveResize(100)).not.toThrow();
    expect(runtime.getSnapshot().widths).toEqual([600, 600]);
    runtime.moveResize(150);
    expect(runtime.getSnapshot().widths).toEqual([650, 600]);
    runtime.cancelResize();
    expect(runtime.getSnapshot()).toMatchObject({ widths: [600, 600], dragging: false });
  });

  it('does not globally redistribute a directed active drag on an ordinary configure', () => {
    const runtime = new TableRuntime();
    const columns: GeometryColumn[] = [
      { id: 'left', mode: 'auto', width: 0, floor: 0, max: Infinity },
      { id: 'fixed', mode: 'fixed', width: 200, floor: 0, max: Infinity, resizable: true },
      { id: 'right', mode: 'auto', width: 0, floor: 0, max: Infinity },
    ];
    runtime.configure(columns, ['row'], [], OPTIONS);
    runtime.updateViewport(VIEWPORT);
    runtime.beginResize('fixed', 0);
    runtime.moveResize(500);
    runtime.configure(columns, ['row'], ['row'], OPTIONS);
    expect(runtime.getSnapshot()).toMatchObject({ widths: [400, 700, 0], dragging: true });
    runtime.moveResize(500);
    expect(runtime.getSnapshot().widths).toEqual([400, 700, 0]);
    runtime.cancelResize();
    expect(runtime.getSnapshot().widths).toEqual([400, 200, 400]);
  });
});

it('keeps the original min/max grab origin through a neutral nested requirement update', () => {
  const runtime = createRuntime();
  runtime.beginResize('description', 486);
  runtime.moveResize(286);
  runtime.setNestedWidth('tiny', 1);
  runtime.moveResize(306);
  expect(runtime.getSnapshot().widths).toEqual([500, 500]);
  runtime.moveResize(506);
  expect(runtime.getSnapshot().widths).toEqual([520, 500]);
});
