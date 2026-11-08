import { describe, expect, it } from 'vitest';

import { pinLayout, pinResizeBounds, resizePin } from '..';

import type { PinColumn, PinningViewport } from '..';

const viewport: PinningViewport = { width: 1000, reserve: 50 };
const pins = (): PinColumn[] => [
  { id: 'a', side: 'left', width: 200 },
  { id: 'b', side: 'left', width: 200 },
  { id: 'c', side: 'right', width: 150 },
];

describe('Pin width budget', () => {
  it('shares one budget between both sides and preserves the actual center width', () => {
    expect(pinLayout(pins(), viewport)).toEqual({
      leftWidth: 400,
      rightWidth: 150,
      totalWidth: 550,
      centerWidth: 450,
      budget: 950,
      remaining: 400,
    });
  });

  it('accepts no pins and a viewport entirely reserved for the center', () => {
    expect(pinLayout([], { width: 50, reserve: 50 })).toEqual({
      leftWidth: 0,
      rightWidth: 0,
      totalWidth: 0,
      centerWidth: 50,
      budget: 0,
      remaining: 0,
    });
    expect(pinLayout([], { width: 0, reserve: 0 }).remaining).toBe(0);
  });

  it('requires no automatic column in the pin context and supports a pin on either side', () => {
    for (const side of ['left', 'right'] as const) {
      const columns = [{ id: 'only', side, width: 300 }];
      expect(pinResizeBounds(columns, viewport, 'only')).toEqual({ min: 0, max: 950 });
      expect(resizePin(columns, viewport, 'only', 1200).columns[0].width).toBe(950);
    }
  });

  it('uses the supplied reserve instead of fixing it at 50', () => {
    expect(pinResizeBounds(pins(), { width: 1000, reserve: 200 }, 'a')).toEqual({ min: 0, max: 450 });
    expect(pinResizeBounds(pins(), { width: 1000, reserve: 0 }, 'a')).toEqual({ min: 0, max: 650 });
  });

  it('preserves fractional units, including a decimal budget boundary', () => {
    const columns: PinColumn[] = [
      { id: 'a', side: 'left', width: 0.1, minWidth: 0.1 },
      { id: 'b', side: 'right', width: 0.2, minWidth: 0.2 },
    ];
    const small = { width: 0.4, reserve: 0.1 };
    expect(pinLayout(columns, small).centerWidth).toBeCloseTo(0.1, 14);
    expect(resizePin(columns, small, 'b', 0.2).columns).toEqual(columns);
    expect(pinResizeBounds(columns, small, 'b').max).toBeGreaterThanOrEqual(0.2);

    const fractional: PinColumn[] = [{ id: 'a', side: 'left', width: 100.125 }];
    expect(resizePin(fractional, { width: 500.375, reserve: 50.125 }, 'a', 200.0625).columns[0].width).toBe(200.0625);
  });

  it('does not depend on column order or on which side consumes the budget', () => {
    const columns = pins();
    expect(pinResizeBounds(columns.toReversed(), viewport, 'b')).toEqual(pinResizeBounds(columns, viewport, 'b'));
    const mirrored: PinColumn[] = columns.map((column) => ({
      ...column,
      side: column.side === 'left' ? 'right' : 'left',
    }));
    expect(pinResizeBounds(mirrored, viewport, 'b')).toEqual(pinResizeBounds(columns, viewport, 'b'));
    expect(pinLayout(mirrored, viewport)).toMatchObject({ leftWidth: 150, rightWidth: 400, remaining: 400 });
  });

  it('scales the numeric tolerance down with small logical units', () => {
    const small = { width: 1e-20, reserve: 5e-21 };
    const columns: PinColumn[] = [{ id: 'a', side: 'left', width: 2e-21 }];
    expect(resizePin(columns, small, 'a', 1).columns[0].width).toBe(5e-21);
    expect(() => pinLayout([{ ...columns[0], width: 1e-16 }], small)).toThrow(/budget/);
  });
});

describe('Independent pin resize', () => {
  it('clamps the requested 800 to 600 without shrinking the other pins', () => {
    const columns = pins();
    expect(pinResizeBounds(columns, viewport, 'a')).toEqual({ min: 0, max: 600 });
    const next = resizePin(columns, viewport, 'a', 800);
    expect(next.columns.map((column) => column.width)).toEqual([600, 200, 150]);
    expect(next.layout).toMatchObject({ leftWidth: 800, rightWidth: 150, centerWidth: 50, remaining: 0 });
  });

  it('applies the same shared limit to a right pin', () => {
    const next = resizePin(pins(), viewport, 'c', 900);
    expect(next.columns.map((column) => column.width)).toEqual([200, 200, 550]);
    expect(next.layout).toMatchObject({ leftWidth: 400, rightWidth: 550, centerWidth: 50, remaining: 0 });
  });

  it('releases budget on shrink and makes it available to the opposite side', () => {
    const full = resizePin(pins(), viewport, 'a', 800);
    const blocked = resizePin(full.columns, viewport, 'c', 400);
    expect(blocked.columns.map((column) => column.width)).toEqual([600, 200, 150]);
    const shrunk = resizePin(blocked.columns, viewport, 'a', 100);
    expect(shrunk.layout.remaining).toBe(500);
    const right = resizePin(shrunk.columns, viewport, 'c', 400);
    expect(right.columns.map((column) => column.width)).toEqual([100, 200, 400]);
    expect(right.layout).toMatchObject({ centerWidth: 300, remaining: 250 });
  });

  it('combines the shared budget with explicit min and max', () => {
    const columns = pins();
    columns[0] = { ...columns[0], minWidth: 120, maxWidth: 350 };
    expect(pinResizeBounds(columns, viewport, 'a')).toEqual({ min: 120, max: 350 });
    expect(resizePin(columns, viewport, 'a', -100).columns[0].width).toBe(120);
    expect(resizePin(columns, viewport, 'a', 1000).columns[0].width).toBe(350);
    columns[0] = { ...columns[0], maxWidth: Infinity };
    expect(pinResizeBounds(columns, viewport, 'a').max).toBe(600);
  });

  it('supports a zero-width or locked pin without an artificial minimum', () => {
    const columns: PinColumn[] = [{ id: 'zero', side: 'left', width: 0, minWidth: 0, maxWidth: 0 }];
    expect(pinResizeBounds(columns, viewport, 'zero')).toEqual({ min: 0, max: 0 });
    expect(resizePin(columns, viewport, 'zero', 500).columns[0].width).toBe(0);
  });

  it('keeps input data unchanged on resize, zero delta, and invalid requests', () => {
    const columns = Object.freeze(pins().map((column) => Object.freeze(column)));
    const frozenViewport = Object.freeze({ ...viewport });
    const next = resizePin(columns, frozenViewport, 'a', 500);
    expect(columns.map((column) => column.width)).toEqual([200, 200, 150]);
    expect(next.columns[0]).not.toBe(columns[0]);
    expect(next.columns[1]).toBe(columns[1]);
    expect(next.columns[2]).toBe(columns[2]);
    expect(resizePin(columns, frozenViewport, 'a', 200).columns).toEqual(columns);
    expect(() => resizePin(columns, frozenViewport, 'a', NaN)).toThrow(RangeError);
    expect(columns.map((column) => column.width)).toEqual([200, 200, 150]);
  });
});

describe('Invalid pin input', () => {
  it.each([-1, NaN, Infinity, -Infinity])('rejects invalid viewport dimensions: %s', (value) => {
    expect(() => pinLayout([], { width: value, reserve: 0 })).toThrow(RangeError);
    expect(() => pinLayout([], { width: 1000, reserve: value })).toThrow(RangeError);
  });

  it('rejects a reserve larger than the viewport, without choosing a fallback policy', () => {
    expect(() => pinLayout([], { width: 40, reserve: 50 })).toThrow(RangeError);
  });

  it('rejects an already overcommitted state instead of squeezing neighbors', () => {
    const columns = pins();
    expect(() => pinLayout(columns, { width: 500, reserve: 50 })).toThrow(/budget/);
    expect(() => resizePin(columns, { width: 500, reserve: 50 }, 'a', 0)).toThrow(/budget/);
    expect(columns.map((column) => column.width)).toEqual([200, 200, 150]);
    expect(() =>
      pinLayout(
        [
          { id: 'a', side: 'left', width: 300, minWidth: 300 },
          { id: 'b', side: 'right', width: 300, minWidth: 300 },
        ],
        { width: 500, reserve: 50 },
      ),
    ).toThrow(/budget/);
  });

  it.each([-1, NaN, Infinity, -Infinity])('rejects an invalid current width: %s', (width) => {
    expect(() => pinLayout([{ id: 'a', side: 'left', width }], viewport)).toThrow(RangeError);
  });

  it.each([
    { minWidth: -1 },
    { minWidth: NaN },
    { minWidth: Infinity },
    { maxWidth: -1 },
    { maxWidth: NaN },
    { maxWidth: -Infinity },
    { minWidth: 250, maxWidth: 200 },
    { minWidth: 250 },
    { maxWidth: 100 },
  ])('rejects incompatible column limits: %j', (limits) => {
    expect(() => pinLayout([{ id: 'a', side: 'left', width: 200, ...limits }], viewport)).toThrow(RangeError);
  });

  it('rejects duplicate ids, invalid sides and unknown resize ids', () => {
    expect(() => pinLayout([pins()[0], pins()[0]], viewport)).toThrow(/Duplicate/);
    expect(() => pinLayout([{ ...pins()[0], side: 'center' as 'left' }], viewport)).toThrow(/side/);
    expect(() => pinResizeBounds(pins(), viewport, 'missing')).toThrow(/Unknown/);
    expect(() => resizePin(pins(), viewport, 'missing', 100)).toThrow(/Unknown/);
  });

  it.each([NaN, Infinity, -Infinity])('rejects a non-finite resize request: %s', (target) => {
    expect(() => resizePin(pins(), viewport, 'a', target)).toThrow(RangeError);
  });

  it('rejects arithmetic overflow and meaningful fractional budget overflow', () => {
    expect(() =>
      pinLayout(
        [
          { id: 'a', side: 'left', width: 1e308 },
          { id: 'b', side: 'right', width: 1e308 },
        ],
        { width: 1e308, reserve: 0 },
      ),
    ).toThrow(/budget/);
    expect(() => pinLayout([{ id: 'a', side: 'left', width: 950 + 1e-8 }], viewport)).toThrow(/budget/);
  });
});

it('preserves the shared budget and other pins through 4000 seeded resize transitions', () => {
  let seed = 78131;
  const random = () => (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296;

  for (let scenario = 0; scenario < 200; scenario++) {
    let columns: readonly PinColumn[] = Array.from({ length: 1 + Math.floor(random() * 8) }, (_, i) => {
      const minWidth = random() * 100;
      const width = minWidth + random() * 200;
      return {
        id: String(i),
        side: random() < 0.5 ? 'left' : 'right',
        width,
        minWidth,
        maxWidth: width + random() * 500,
      };
    });
    const reserve = random() * 100;
    const view = {
      width: columns.reduce((sum, column) => sum + column.width, 0) + reserve + random() * 500,
      reserve,
    };

    for (let step = 0; step < 20; step++) {
      const active = Math.floor(random() * columns.length);
      const before = columns;
      const next = resizePin(columns, view, columns[active].id, random() * 3000 - 100);
      expect(next.layout.totalWidth).toBeLessThanOrEqual(view.width - reserve + 1e-9);
      expect(next.layout.centerWidth).toBeGreaterThanOrEqual(reserve - 1e-9);
      next.columns.forEach((column, i) => {
        expect(column.width).toBeGreaterThanOrEqual(column.minWidth!);
        expect(column.width).toBeLessThanOrEqual(column.maxWidth!);
        expect(column.id).toBe(before[i].id);
        expect(column.side).toBe(before[i].side);
        if (i !== active) expect(column).toBe(before[i]);
      });
      columns = next.columns;
    }
  }
});
