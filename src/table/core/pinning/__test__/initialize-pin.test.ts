import { describe, expect, it } from 'vitest';

import { initializePin, resizePin } from '..';

import type { PinCandidate, PinColumn, PinWidthSource } from '..';

const viewport = { width: 1000, reserve: 50 };
const candidate = (source: PinWidthSource): PinCandidate => ({ id: 'new', side: 'left', source });

describe('Initial pin width source', () => {
  it('uses the auto base instead of a huge current width or manual request', () => {
    const ordinary = Object.freeze({ mode: 'auto' as const, base: 240, width: 5000, manual: 5000 });
    const next = initializePin([], viewport, candidate(ordinary));
    expect(next.columns).toEqual([{ id: 'new', side: 'left', width: 240 }]);
    expect(next.layout).toMatchObject({ leftWidth: 240, centerWidth: 760, remaining: 710 });
    expect(ordinary).toEqual({ mode: 'auto', base: 240, width: 5000, manual: 5000 });

    const resized = resizePin(next.columns, viewport, 'new', 400);
    expect(resized.columns[0].width).toBe(400);
    expect(ordinary.manual).toBe(5000);
    expect(ordinary.base).toBe(240);
  });

  it('uses the declared fixed width instead of the current resized width', () => {
    const ordinary = Object.freeze({ mode: 'fixed' as const, declaredWidth: 180, width: 6000 });
    expect(initializePin([], viewport, candidate(ordinary)).columns).toEqual([{ id: 'new', side: 'left', width: 180 }]);
    expect(ordinary.width).toBe(6000);
    expect(ordinary.declaredWidth).toBe(180);
  });

  it('clamps even a large base or declaration to the common pin budget', () => {
    for (const source of [
      { mode: 'auto', base: 5000 },
      { mode: 'fixed', declaredWidth: 5000 },
    ] satisfies PinWidthSource[]) {
      const next = initializePin([], viewport, candidate(source));
      expect(next.columns[0].width).toBe(950);
      expect(next.layout).toMatchObject({ centerWidth: 50, remaining: 0 });
    }
  });

  it('accepts a zero source width without inventing a minimum', () => {
    expect(initializePin([], viewport, candidate({ mode: 'auto', base: 0 })).columns[0].width).toBe(0);
    expect(initializePin([], viewport, candidate({ mode: 'fixed', declaredWidth: 0 })).columns[0].width).toBe(0);
  });
});

describe('Initialization constraints', () => {
  it('raises the source to the declared minimum', () => {
    const next = initializePin([], viewport, { ...candidate({ mode: 'auto', base: 20 }), minWidth: 80 });
    expect(next.columns[0]).toEqual({ id: 'new', side: 'left', width: 80, minWidth: 80 });
  });

  it('caps the source at its own maximum before exhausting the common budget', () => {
    const next = initializePin([], viewport, {
      ...candidate({ mode: 'fixed', declaredWidth: 600 }),
      minWidth: 100,
      maxWidth: 300,
    });
    expect(next.columns[0]).toEqual({ id: 'new', side: 'left', width: 300, minWidth: 100, maxWidth: 300 });
    expect(next.layout.remaining).toBe(650);
  });

  it.each(['left', 'right'] as const)('accounts for existing pins on both sides when adding a %s pin', (side) => {
    const columns: PinColumn[] = [
      { id: 'left', side: 'left', width: 400 },
      { id: 'right', side: 'right', width: 300 },
    ];
    const next = initializePin(columns, viewport, {
      ...candidate({ mode: 'auto', base: 500 }),
      side,
      minWidth: 100,
      maxWidth: Infinity,
    });
    expect(next.columns[2].width).toBe(250);
    expect(next.layout).toMatchObject({ totalWidth: 950, centerWidth: 50, remaining: 0 });
    expect(next.columns[0]).toBe(columns[0]);
    expect(next.columns[1]).toBe(columns[1]);
  });

  it('uses the supplied reserve when choosing the initial width', () => {
    const next = initializePin([], { width: 1000, reserve: 200 }, candidate({ mode: 'auto', base: 900 }));
    expect(next.columns[0].width).toBe(800);
    expect(next.layout.centerWidth).toBe(200);
  });

  it('initializes an exactly fitting minimum at a decimal budget boundary', () => {
    const columns: PinColumn[] = [{ id: 'left', side: 'left', width: 0.1 }];
    const next = initializePin(
      columns,
      { width: 0.4, reserve: 0.1 },
      {
        ...candidate({ mode: 'auto', base: 0.5 }),
        side: 'right',
        minWidth: 0.2,
      },
    );
    expect(next.columns[1].width).toBeCloseTo(0.2, 14);
    expect(next.columns[1].width).toBeGreaterThanOrEqual(0.2);
    expect(next.layout.centerWidth).toBeCloseTo(0.1, 14);
    expect(next.columns[0]).toBe(columns[0]);
  });

  it('retains fractional source widths without token rounding', () => {
    const next = initializePin([], viewport, candidate({ mode: 'auto', base: 240.0625 }));
    expect(next.columns[0].width).toBe(240.0625);
  });

  it('can add a zero-width pin to a fully occupied budget', () => {
    const columns: PinColumn[] = [{ id: 'occupied', side: 'right', width: 950 }];
    const next = initializePin(columns, viewport, candidate({ mode: 'fixed', declaredWidth: 100 }));
    expect(next.columns.map((column) => column.width)).toEqual([950, 0]);
    expect(next.layout.centerWidth).toBe(50);
  });

  it('preserves input order, metadata and ordinary source through successive single-pin commands', () => {
    const ordinary = Object.freeze({ mode: 'auto' as const, base: 240, width: 5000, manual: 5000 });
    const first = initializePin([], viewport, { id: 'first', side: 'right', source: ordinary, minWidth: 100 });
    const before = Object.freeze(first.columns.map((column) => Object.freeze(column)));
    const command = Object.freeze({ ...candidate(ordinary), side: 'left' as const, maxWidth: 300 });
    const next = initializePin(before, Object.freeze({ ...viewport }), command);
    expect(next.columns).toEqual([
      { id: 'first', side: 'right', width: 240, minWidth: 100 },
      { id: 'new', side: 'left', width: 240, maxWidth: 300 },
    ]);
    expect(next.columns[0]).toBe(before[0]);
    expect(before).toEqual(first.columns);
    expect(command.source).toBe(ordinary);
    expect(ordinary).toEqual({ mode: 'auto', base: 240, width: 5000, manual: 5000 });
  });
});

describe('Rejected pin transitions', () => {
  it('rejects an infeasible minimum without shrinking or mutating existing pins', () => {
    const columns = Object.freeze([
      Object.freeze({ id: 'left', side: 'left' as const, width: 400 }),
      Object.freeze({ id: 'right', side: 'right' as const, width: 400 }),
    ]);
    expect(() =>
      initializePin(columns, viewport, { ...candidate({ mode: 'auto', base: 240 }), minWidth: 200 }),
    ).toThrow(/budget/);
    expect(columns.map((column) => column.width)).toEqual([400, 400]);
  });

  it('rejects a repeated id instead of resetting an already resized pin', () => {
    const columns: PinColumn[] = [{ id: 'new', side: 'right', width: 600 }];
    expect(() => initializePin(columns, viewport, candidate({ mode: 'auto', base: 240 }))).toThrow(/Duplicate/);
    expect(columns).toEqual([{ id: 'new', side: 'right', width: 600 }]);
  });

  it.each([-1, NaN, Infinity, -Infinity])('rejects an invalid source width %s for either mode', (width) => {
    expect(() => initializePin([], viewport, candidate({ mode: 'auto', base: width }))).toThrow(RangeError);
    expect(() => initializePin([], viewport, candidate({ mode: 'fixed', declaredWidth: width }))).toThrow(RangeError);
  });

  it('rejects an unsupported source mode', () => {
    const source = { mode: 'content', base: 240 } as unknown as PinWidthSource;
    expect(() => initializePin([], viewport, candidate(source))).toThrow(/source/);
  });

  it.each([
    { minWidth: -1 },
    { minWidth: NaN },
    { minWidth: Infinity },
    { maxWidth: -1 },
    { maxWidth: NaN },
    { maxWidth: -Infinity },
    { minWidth: 300, maxWidth: 200 },
  ])('rejects invalid bounds without repairing them: %j', (limits) => {
    expect(() => initializePin([], viewport, { ...candidate({ mode: 'auto', base: 240 }), ...limits })).toThrow(
      RangeError,
    );
  });

  it('rejects an invalid side or an already invalid existing state', () => {
    expect(() =>
      initializePin([], viewport, { ...candidate({ mode: 'auto', base: 240 }), side: 'center' as 'left' }),
    ).toThrow(/side/);
    expect(() =>
      initializePin([{ id: 'old', side: 'left', width: 951 }], viewport, candidate({ mode: 'auto', base: 240 })),
    ).toThrow(/budget/);
    expect(() => initializePin([], { width: 20, reserve: 50 }, candidate({ mode: 'auto', base: 240 }))).toThrow(
      RangeError,
    );
  });
});

it('initializes pins independently through 1000 seeded feasible single-pin transitions', () => {
  let seed = 54713;
  const random = () => (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296;

  for (let scenario = 0; scenario < 200; scenario++) {
    let columns: readonly PinColumn[] = [];
    const view = { width: 1000 + random() * 1000, reserve: 50 + random() * 100 };
    for (let i = 0; i < 5; i++) {
      const before = columns;
      const source: PinWidthSource =
        random() < 0.5 ? { mode: 'auto', base: random() * 5000 } : { mode: 'fixed', declaredWidth: random() * 5000 };
      const next = initializePin(columns, view, {
        id: String(i),
        side: random() < 0.5 ? 'left' : 'right',
        source,
        maxWidth: random() * 1000,
      });
      expect(next.columns).toHaveLength(i + 1);
      expect(next.layout.totalWidth).toBeLessThanOrEqual(view.width - view.reserve + 1e-9);
      expect(next.layout.centerWidth).toBeGreaterThanOrEqual(view.reserve - 1e-9);
      expect(next.columns[i].width).toBeGreaterThanOrEqual(0);
      expect(next.columns[i].width).toBeLessThanOrEqual(next.columns[i].maxWidth!);
      before.forEach((column, index) => expect(next.columns[index]).toBe(column));
      columns = next.columns;
    }
  }
});
