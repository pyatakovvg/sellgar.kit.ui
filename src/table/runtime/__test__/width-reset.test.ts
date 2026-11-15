import { describe, expect, it } from 'vitest';

import { TableRuntime } from '../table-runtime';
import { TableBrowser } from '../browser/table-browser';

import type { GeometryColumn } from '../../core/layout/types';

const options = { rowHeight: 40, minRowHeight: 32, overscan: 2, virtual: false, sticky: true };
const viewport = (width: number) => ({
  container: width,
  width,
  height: 400,
  left: 0,
  top: 0,
  scroll: 0,
  screenLeft: 0,
  scale: 1,
});
const fixed = (id: string, width: number, pin?: 'left' | 'right'): GeometryColumn => ({
  id,
  width,
  mode: 'fixed',
  floor: 0,
  max: Infinity,
  resizable: true,
  pin,
});
const auto = (id: string): GeometryColumn => ({ id, width: 0, mode: 'auto', floor: 0, max: Infinity, resizable: true });
const create = (columns: GeometryColumn[], width = 661) => {
  const runtime = new TableRuntime();
  runtime.configure(columns, ['row'], [], options);
  runtime.updateViewport(viewport(width));
  return runtime;
};
const resize = (runtime: TableRuntime, id: string, delta: number) => {
  expect(runtime.beginResize(id, 0)).toBe(true);
  runtime.moveResize(delta);
  runtime.finishResize();
};

describe('Column width reset', () => {
  it('restores declared fixed width without clearing a manual auto to its left', () => {
    const runtime = create([auto('name'), fixed('price', 160), fixed('tail', 140)]);
    resize(runtime, 'name', 200);
    resize(runtime, 'price', -60);
    expect(runtime.getSnapshot().widths).toEqual([561, 100, 140]);
    new TableBrowser(runtime).resetColumnWidth('price');
    expect(runtime.getSnapshot().widths).toEqual([561, 160, 140]);
    expect(runtime.getSnapshot().dragging).toBe(false);
  });

  it('uses directed compensation when restoring a fixed width', () => {
    const runtime = create([fixed('price', 160), auto('name')]);
    resize(runtime, 'price', 100);
    expect(runtime.getSnapshot().widths).toEqual([260, 401]);
    runtime.resetColumnWidth('price');
    expect(runtime.getSnapshot().widths).toEqual([160, 501]);
  });

  it('clears manual auto width and recalculates fill after fixed width changed', () => {
    const runtime = create([auto('name'), fixed('price', 160), fixed('tail', 140)]);
    resize(runtime, 'name', 200);
    resize(runtime, 'price', -80);
    expect(runtime.resetColumnWidth('name')).toBe(true);
    expect(runtime.getSnapshot().widths).toEqual([441, 80, 140]);
    expect(runtime.getSnapshot().total).toBe(661);
  });

  it('clears a masked manual auto request so it cannot reappear after viewport shrink', () => {
    const runtime = create([auto('first'), auto('last')], 1000);
    resize(runtime, 'first', 100);
    runtime.updateViewport(viewport(1400));
    expect(runtime.getSnapshot().widths).toEqual([700, 700]);
    runtime.resetColumnWidth('first');
    runtime.updateViewport(viewport(1000));
    expect(runtime.getSnapshot().widths).toEqual([500, 500]);
  });

  it('restores the declaration and fills the remaining space with the compensator', () => {
    const runtime = create([fixed('price', 100), { ...auto('name'), max: 300 }], 400);
    resize(runtime, 'price', 400);
    runtime.updateViewport(viewport(800));
    runtime.resetColumnWidth('price');
    expect(runtime.getSnapshot().widths).toEqual([100, 300, 400]);
    expect(runtime.getSnapshot().total).toBe(800);
  });

  it.each(['left', 'right'] as const)('restores initial %s pin width through the independent pin operation', (side) => {
    const runtime = create([fixed('pin', 160, side), auto('name')]);
    const edge = side === 'left' ? 'right' : 'left';
    runtime.beginPinResize('pin', 0, edge);
    runtime.moveResize(side === 'left' ? 80 : -80);
    runtime.finishResize();
    expect(runtime.getSnapshot().columns.find((column) => column.id === 'pin')?.width).toBe(240);
    expect(runtime.resetColumnWidth('pin')).toBe(true);
    expect(runtime.getSnapshot().columns.find((column) => column.id === 'pin')?.width).toBe(160);
  });

  it('restores the initialized pin width rather than an oversized declaration', () => {
    const runtime = create([fixed('left', 300, 'left'), auto('name'), fixed('right', 300, 'right')], 500);
    runtime.beginPinResize('left', 0, 'right');
    runtime.moveResize(-100);
    runtime.finishResize();
    runtime.beginPinResize('right', 0, 'left');
    runtime.moveResize(100);
    runtime.finishResize();
    runtime.resetColumnWidth('left');
    expect(runtime.getSnapshot().columns.find((column) => column.id === 'left')?.width).toBe(225);
  });

  it('respects disabled and active-drag permissions and allows the last column', () => {
    const runtime = create([{ ...fixed('disabled', 100), resizable: false }, auto('name'), fixed('last', 100)]);
    expect(runtime.resetColumnWidth('disabled')).toBe(false);
    expect(runtime.resetColumnWidth('last')).toBe(true);
    expect(runtime.resetColumnWidth('missing')).toBe(false);
    runtime.beginResize('name', 0);
    runtime.moveResize(100);
    const before = runtime.getSnapshot().widths;
    expect(runtime.resetColumnWidth('name')).toBe(false);
    expect(runtime.getSnapshot().widths).toEqual(before);
    expect(runtime.getSnapshot().dragging).toBe(true);
  });
});
