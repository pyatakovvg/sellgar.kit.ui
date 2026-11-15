import { describe, expect, it } from 'vitest';

import { Axis } from '../../core/geometry/axis';
import { VirtualWindow } from '../rendering/virtual-window';
import { TableRuntime } from '../table-runtime';

import type { GeometryColumn } from '../../core/layout/types';

const OPTIONS = { rowHeight: 40, minRowHeight: 40, overscan: 3, virtual: true, sticky: true, expansion: true };
const IDS = Array.from({ length: 10000 }, (_, index) => `row:${index}`);
const COLUMNS: GeometryColumn[] = Array.from({ length: 100 }, (_, index) => ({
  id: `column:${index}`,
  mode: index === 99 ? 'auto' : 'fixed',
  width: 120,
  floor: 60,
  max: Infinity,
  resizable: true,
}));
const VIEWPORT = { width: 800, container: 800, height: 400, scroll: 4000, left: 1000, top: 0, screenLeft: 0, scale: 1 };
const setup = () => {
  const runtime = new TableRuntime();
  runtime.configure(COLUMNS, IDS, [], OPTIONS);
  runtime.updateViewport(VIEWPORT);
  return runtime;
};

describe('Buffered virtual window', () => {
  it('reuses the prepared range until its safety margin is reached', () => {
    const axis = new Axis(Array(1000).fill(40));
    const window = new VirtualWindow();
    const first = window.range(axis, 4000, 4400, 3);
    expect(window.range(axis, 4040, 4440, 3)).toBe(first);
    expect(window.range(axis, 4080, 4480, 3)).toBe(first);
    expect(window.range(axis, 4520, 4920, 3)).not.toBe(first);
    expect(first[0]).toBeLessThan(axis.at(4000));
    expect(first.at(-1)).toBeGreaterThan(axis.at(4400));
  });

  it('keeps coverage and bounded memory through forward, reverse and distant jumps', () => {
    const axis = new Axis(Array(10000).fill(40));
    const window = new VirtualWindow();
    for (const start of [0, 24, 240, 480, 800, 500, 200, 100000, 400, 399600]) {
      const indices = window.range(axis, start, start + 400, 3);
      for (const index of axis.range(start, start + 400)) expect(indices).toContain(index);
      expect(indices.length).toBeLessThanOrEqual(3 * 10 + 2 * 3 + 2);
    }
  });

  it('rechecks bounds after dynamic heights change on the same axis', () => {
    const axis = new Axis(Array(1000).fill(40));
    const window = new VirtualWindow();
    window.range(axis, 4000, 4400, 3);
    axis.set(10, 2000);
    const indices = window.range(axis, 4000, 4400, 3);
    for (const index of axis.range(4000, 4400)) expect(indices).toContain(index);
  });

  it('resets for a new axis, viewport extent or overscan and honors explicit zero', () => {
    const window = new VirtualWindow();
    const axis = new Axis(Array(1000).fill(40));
    const initial = window.range(axis, 4000, 4400, 3);
    expect(window.range(axis, 4000, 4800, 3)).not.toBe(initial);
    expect(window.range(axis, 4000, 4400, 0)).toEqual(axis.range(4000, 4400));
    expect(window.range(new Axis([40, 40]), 0, 400, 3)).toEqual([0, 1]);
    expect(window.range(axis, -800, -400, 3)).toEqual([]);
    expect(window.range(axis, 80000, 80400, 3)).toEqual([]);
    expect(window.range(axis, 4000, 4000, 3)).toEqual([]);
  });
});

describe('React render snapshot vs live geometry', () => {
  it('keeps React content stable during native horizontal, vertical and diagonal scroll', () => {
    const runtime = setup();
    const render = runtime.getRenderSnapshot();
    const live = runtime.getSnapshot();
    for (let delta = 1; delta <= 40; delta++) {
      runtime.updateViewport({ ...VIEWPORT, left: VIEWPORT.left + delta, scroll: VIEWPORT.scroll + delta });
      expect(runtime.getRenderSnapshot()).toBe(render);
    }
    expect(runtime.getSnapshot()).not.toBe(live);
    expect(runtime.getSnapshot().viewport.left).toBe(1040);
    expect(runtime.getSnapshot().columns[0].displayOffset).not.toBe(live.columns[0].displayOffset);
  });

  it('changes membership before the prepared edge and retains existing row/cell input identities', () => {
    const runtime = setup();
    const first = runtime.getRenderSnapshot();
    runtime.updateViewport({ ...VIEWPORT, scroll: 4480 });
    const next = runtime.getRenderSnapshot();
    expect(next).not.toBe(first);
    expect(next.columns).toBe(first.columns);
    const retained = first.rows.find((row) => next.rows.some((item) => row.id === item.id))!;
    expect(next.rows.find((row) => row.id === retained.id)).toBe(retained);
    expect(next.rows.some((row) => row.top <= 4480 && row.top + row.height > 4480)).toBe(true);
  });

  it('changes control state on resize and reports completion through the existing runtime contract', () => {
    const runtime = setup();
    const before = runtime.getRenderSnapshot();
    expect(runtime.beginResize('column:10', 0)).toBe(true);
    runtime.moveResize(30);
    expect(runtime.getRenderSnapshot()).not.toBe(before);
    expect(runtime.getRenderSnapshot().columns.find((column) => column.id === 'column:10')?.width).toBe(150);
    runtime.cancelResize();
    expect(runtime.getColumnWidth('column:10')).toBe(120);
  });

  it('reacts to disclosure, measurements, permissions, scale and data removal', () => {
    const runtime = setup();
    let previous = runtime.getRenderSnapshot();
    runtime.toggleExpanded('row:100');
    expect(runtime.getRenderSnapshot()).not.toBe(previous);
    previous = runtime.getRenderSnapshot();
    runtime.commitMeasurements([
      { rowId: 'row:100', columnId: 'column:10', height: 80, version: runtime.getSnapshot().version },
    ]);
    expect(runtime.getRenderSnapshot()).not.toBe(previous);
    previous = runtime.getRenderSnapshot();
    runtime.updateViewport({ ...VIEWPORT, scale: 2, scaleY: 2 });
    expect(runtime.getRenderSnapshot()).not.toBe(previous);
    runtime.configure(
      COLUMNS.map((column) => ({ ...column, resizable: false })),
      IDS,
      [],
      OPTIONS,
    );
    expect(runtime.getRenderSnapshot().columns.every((column) => !column.resizable)).toBe(true);
    runtime.configure(COLUMNS, IDS.slice(200), [], OPTIONS);
    expect(runtime.getRenderSnapshot().rowCount).toBe(9800);
    expect(runtime.getRowGeometry('row:100')).toBeUndefined();
  });

  it('keeps complete geometry available for DOM awaiting a React commit without retaining old windows', () => {
    const runtime = setup();
    const old = runtime.getSnapshot();
    const row = old.rows[0];
    const column = old.columns[0];
    runtime.updateViewport({ ...VIEWPORT, scroll: 120000, left: 9000 });
    expect(runtime.getSnapshot().rows.some((item) => item.id === row.id)).toBe(false);
    expect(runtime.getSnapshot().columns.some((item) => item.id === column.id)).toBe(false);
    expect(runtime.getRowGeometry(row.id)).toEqual(row);
    expect(runtime.getColumnGeometry(column.id)?.width).toBe(column.width);
    expect(runtime.getColumnGeometry(column.id)?.displayOffset).not.toBe(column.displayOffset);
    expect(runtime.getSnapshot().rows.length * runtime.getSnapshot().columns.length).toBeLessThan(2000);
  });

  it('keeps pins projected live while React inputs stay stable, including suspended pinning', () => {
    const runtime = new TableRuntime();
    const columns = COLUMNS.map((column, index) => ({
      ...column,
      mode: index === 98 ? ('auto' as const) : ('fixed' as const),
      pin: index === 0 ? ('left' as const) : index === 99 ? ('right' as const) : undefined,
    }));
    runtime.configure(columns, IDS, [], OPTIONS);
    runtime.updateViewport(VIEWPORT);
    const render = runtime.getRenderSnapshot();
    runtime.updateViewport({ ...VIEWPORT, left: 1040 });
    expect(runtime.getRenderSnapshot()).toBe(render);
    const pins = runtime.getSnapshot().columns.filter((column) => column.region !== 'center');
    expect(pins).toHaveLength(2);
    expect(pins.map((column) => column.displayOffset)).toEqual([0, 680]);
    runtime.updateViewport({ ...VIEWPORT, container: 200, width: 200 });
    expect(runtime.getSnapshot().pinning?.status).toBe('suspended');
    expect(runtime.getRenderSnapshot()).not.toBe(render);
  });

  it('disables row buffering explicitly and keeps virtualization=false functional', () => {
    const runtime = setup();
    runtime.configure(COLUMNS, IDS, [], { ...OPTIONS, overscan: 0 });
    expect(runtime.getSnapshot().rows.length).toBeLessThan(12);
    runtime.configure(COLUMNS, IDS.slice(0, 20), [], { ...OPTIONS, virtual: false });
    expect(runtime.getRenderSnapshot().rows).toHaveLength(20);
    expect(runtime.getRenderSnapshot().columns).toHaveLength(100);
  });
});
