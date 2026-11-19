import { describe, expect, it } from 'vitest';

import { initializePins, resizePin } from '..';

import type { PinCandidate, PinColumn } from '..';

const viewport = { width: 1000, reserve: 50 };
const equalCandidates = (): PinCandidate[] => [
  { id: 'a', side: 'left', minWidth: 100, source: { mode: 'auto', base: 600 } },
  { id: 'b', side: 'right', minWidth: 100, source: { mode: 'fixed', declaredWidth: 600 } },
];

describe('Atomic initialization of a pin set', () => {
  it('allocates 475/475 for two requested widths of 600 with minima of 100 and a budget of 950', () => {
    const next = initializePins([], viewport, equalCandidates());
    expect(next.columns.map((column) => column.width)).toEqual([475, 475]);
    expect(next.layout).toMatchObject({ leftWidth: 475, rightWidth: 475, centerWidth: 50, remaining: 0 });
  });

  it('scales only the excess above minima and preserves existing pins', () => {
    const old: PinColumn = { id: 'old', side: 'left', width: 300 };
    const next = initializePins([old], viewport, [
      { id: 'a', side: 'left', minWidth: 100, source: { mode: 'auto', base: 500 } },
      { id: 'b', side: 'right', minWidth: 200, source: { mode: 'fixed', declaredWidth: 500 } },
    ]);
    expect(next.columns.map((column) => column.width)).toEqual([300, 300, 350]);
    expect(next.columns[0]).toBe(old);
    expect(next.layout.centerWidth).toBe(50);
  });

  it('clamps to own maxima before calculating proportional shares', () => {
    const next = initializePins([], viewport, [
      { id: 'a', side: 'left', minWidth: 100, maxWidth: 200, source: { mode: 'auto', base: 1000000 } },
      { id: 'b', side: 'right', minWidth: 100, source: { mode: 'auto', base: 800 } },
    ]);
    expect(next.columns.map((column) => column.width)).toEqual([193.75, 756.25]);
    expect(next.layout.totalWidth).toBe(950);
  });

  it('preserves exact desired widths when they fit and does not fill unused space', () => {
    const next = initializePins([], viewport, [
      { id: 'a', side: 'left', minWidth: 100, source: { mode: 'auto', base: 20 } },
      { id: 'b', side: 'right', source: { mode: 'fixed', declaredWidth: 240.0625 } },
    ]);
    expect(next.columns.map((column) => column.width)).toEqual([100, 240.0625]);
    expect(next.layout.centerWidth).toBe(659.9375);
    expect(next.layout.remaining).toBe(609.9375);
  });

  it('returns minima when the minimum set exactly consumes the budget', () => {
    const next = initializePins([], viewport, [
      { id: 'a', side: 'left', minWidth: 300, source: { mode: 'auto', base: 1000 } },
      { id: 'b', side: 'right', minWidth: 650, source: { mode: 'auto', base: 1000 } },
    ]);
    expect(next.columns.map((column) => column.width)).toEqual([300, 650]);
    expect(next.layout.centerWidth).toBe(50);
  });

  it('does not assign a share to locked pins', () => {
    const next = initializePins([], viewport, [
      { id: 'locked', side: 'left', minWidth: 100, maxWidth: 100, source: { mode: 'auto', base: 1000 } },
      { id: 'flexible', side: 'right', source: { mode: 'auto', base: 1000 } },
    ]);
    expect(next.columns.map((column) => column.width)).toEqual([100, 850]);
  });

  it('uses the supplied reserve for the whole set', () => {
    const next = initializePins([], { width: 1000, reserve: 200 }, equalCandidates());
    expect(next.columns.map((column) => column.width)).toEqual([400, 400]);
    expect(next.layout.centerWidth).toBe(200);
  });

  it('handles empty, all-zero and zero-budget sets', () => {
    const old: PinColumn = { id: 'old', side: 'left', width: 200 };
    expect(initializePins([old], viewport, []).columns).toEqual([old]);
    const zero: PinCandidate[] = [
      { id: 'a', side: 'left', source: { mode: 'auto', base: 0 } },
      { id: 'b', side: 'right', source: { mode: 'fixed', declaredWidth: 0 } },
    ];
    expect(initializePins([], viewport, zero).columns.map((column) => column.width)).toEqual([0, 0]);
    expect(
      initializePins(
        [],
        { width: 50, reserve: 50 },
        equalCandidates().map((column) => ({
          ...column,
          minWidth: 0,
        })),
      ).columns.map((column) => column.width),
    ).toEqual([0, 0]);
  });

  it('ignores huge previous manual widths and keeps the source data unchanged', () => {
    const ordinary = Object.freeze({ mode: 'auto' as const, base: 600, manual: 5000, width: 5000 });
    const commands = Object.freeze(equalCandidates().map((column) => Object.freeze({ ...column, source: ordinary })));
    const next = initializePins(Object.freeze([]), Object.freeze({ ...viewport }), commands);
    expect(next.columns.map((column) => column.width)).toEqual([475, 475]);
    expect(next.columns[0]).toEqual({ id: 'a', side: 'left', minWidth: 100, width: 475 });
    expect(ordinary).toEqual({ mode: 'auto', base: 600, manual: 5000, width: 5000 });
    expect(commands[0].source).toBe(ordinary);
  });

  it('keeps subsequent pin resizing independent after the initial proportional allocation', () => {
    const initial = initializePins([], viewport, equalCandidates());
    const shrunk = resizePin(initial.columns, viewport, 'a', 200);
    const expanded = resizePin(shrunk.columns, viewport, 'b', 900);
    expect(expanded.columns.map((column) => column.width)).toEqual([200, 750]);
    expect(initial.columns.map((column) => column.width)).toEqual([475, 475]);
  });
});

describe('Order independence', () => {
  it('preserves the input sequence while assigning the same width to each id for every permutation', () => {
    const old: PinColumn[] = [
      { id: 'old-z', side: 'left', width: 60.1 },
      { id: 'old-a', side: 'right', width: 80.2 },
    ];
    const candidates: PinCandidate[] = [
      { id: 'z', side: 'right', minWidth: 100.1, source: { mode: 'auto', base: 880.2 } },
      { id: 'a', side: 'left', minWidth: 70.3, source: { mode: 'fixed', declaredWidth: 440.6 } },
      { id: 'm', side: 'left', minWidth: 50.7, source: { mode: 'auto', base: 650.4 } },
    ];
    const orders = [
      [0, 1, 2],
      [0, 2, 1],
      [1, 0, 2],
      [1, 2, 0],
      [2, 0, 1],
      [2, 1, 0],
    ];
    const widths = new Map(
      initializePins(old, viewport, candidates).columns.map((column) => [column.id, column.width]),
    );
    for (const order of orders) {
      const reordered = order.map((i) => candidates[i]);
      const next = initializePins(old.toReversed(), viewport, reordered);
      expect(next.columns.map((column) => column.id)).toEqual(
        [...old.toReversed(), ...reordered].map((column) => column.id),
      );
      next.columns.forEach((column) => expect(column.width).toBe(widths.get(column.id)));
      expect(next.layout.centerWidth).toBeCloseTo(50, 10);
    }
  });

  it('does not favor one pinned side over the other', () => {
    const next = initializePins(
      [],
      viewport,
      equalCandidates().map((column) => ({ ...column, side: 'left' })),
    );
    expect(next.columns.map((column) => column.width)).toEqual([475, 475]);
    expect(next.layout).toMatchObject({ leftWidth: 950, rightWidth: 0, centerWidth: 50 });
  });
});

describe('Atomic failure', () => {
  it('rejects the whole set when minima do not fit, preserving existing pins and all candidates', () => {
    const old = Object.freeze([
      Object.freeze({ id: 'old-l', side: 'left' as const, width: 400 }),
      Object.freeze({ id: 'old-r', side: 'right' as const, width: 400 }),
    ]);
    const commands = Object.freeze(equalCandidates().map((column) => Object.freeze(column)));
    expect(() => initializePins(old, viewport, commands)).toThrow(/budget/);
    expect(old.map((column) => column.width)).toEqual([400, 400]);
    expect(commands.map((column) => column.minWidth)).toEqual([100, 100]);
  });

  it('rejects duplicate candidate ids and collisions with existing pins', () => {
    const candidates = equalCandidates();
    expect(() => initializePins([], viewport, [candidates[0], candidates[0]])).toThrow(/Duplicate/);
    expect(() => initializePins([{ id: 'a', side: 'right', width: 300 }], viewport, candidates)).toThrow(/Duplicate/);
  });

  it('rejects an invalid last candidate without changing the previously prepared candidates', () => {
    const candidates = equalCandidates();
    const invalid = { ...candidates[1], minWidth: 300, maxWidth: 200 };
    expect(() => initializePins([], viewport, [candidates[0], invalid])).toThrow(RangeError);
    expect(candidates[0]).toEqual({ id: 'a', side: 'left', minWidth: 100, source: { mode: 'auto', base: 600 } });
    expect(() =>
      initializePins([], viewport, [
        candidates[0],
        {
          ...candidates[1],
          source: { mode: 'auto', base: Infinity },
        },
      ]),
    ).toThrow(RangeError);
  });

  it('rejects an invalid existing state even for an empty batch', () => {
    expect(() => initializePins([{ id: 'old', side: 'left', width: 951 }], viewport, [])).toThrow(/budget/);
    expect(() => initializePins([], { width: 20, reserve: 50 }, [])).toThrow(RangeError);
  });
});

describe('Numeric range', () => {
  it('allocates finite preferences whose sum overflows', () => {
    const candidates: PinCandidate[] = [
      { id: 'a', side: 'left', source: { mode: 'auto', base: 1e308 } },
      { id: 'b', side: 'right', source: { mode: 'fixed', declaredWidth: 1e308 } },
    ];
    const next = initializePins([], viewport, candidates);
    next.columns.forEach((column) => expect(column.width).toBeCloseTo(475, 10));
    expect(next.layout.centerWidth).toBeCloseTo(50, 10);
  });

  it('preserves tiny allocations when the common scale factor underflows', () => {
    const candidates: PinCandidate[] = [
      { id: 'a', side: 'left', source: { mode: 'auto', base: 1e308 } },
      { id: 'b', side: 'right', source: { mode: 'auto', base: 1e308 } },
    ];
    const next = initializePins([], { width: 1e-308, reserve: 0 }, candidates);
    expect(next.columns.map((column) => column.width)).toEqual([5e-309, 5e-309]);
    expect(next.layout.remaining).toBe(0);
  });
});

it('preserves constraints, common proportional scale and permutation invariance in 300 seeded batches', () => {
  let seed = 3491;
  const random = () => (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296;

  for (let scenario = 0; scenario < 300; scenario++) {
    const old: PinColumn[] = [
      { id: 'old-l', side: 'left', width: random() * 100 },
      { id: 'old-r', side: 'right', width: random() * 100 },
    ];
    const candidates: PinCandidate[] = Array.from({ length: 1 + Math.floor(random() * 8) }, (_, i) => {
      const minWidth = random() * 20;
      return {
        id: String(i),
        side: random() < 0.5 ? 'left' : 'right',
        minWidth,
        maxWidth: minWidth + random() * 1000,
        source: { mode: 'auto', base: random() * 2000 },
      };
    });
    const view = { width: 1000 + random() * 500, reserve: random() * 150 };
    const next = initializePins(old, view, candidates);
    const reversed = initializePins(old.toReversed(), view, candidates.toReversed());
    const widths = new Map(next.columns.map((column) => [column.id, column.width]));
    reversed.columns.forEach((column) => expect(column.width).toBe(widths.get(column.id)));
    old.forEach((column, i) => expect(next.columns[i]).toBe(column));
    expect(next.layout.centerWidth).toBeGreaterThanOrEqual(view.reserve - 1e-9);
    const ratios: number[] = [];
    candidates.forEach((candidate, i) => {
      const width = next.columns[old.length + i].width;
      const minimum = candidate.minWidth!;
      const preferred = Math.min(
        candidate.maxWidth!,
        Math.max(minimum, candidate.source.mode === 'auto' ? candidate.source.base : candidate.source.declaredWidth),
      );
      expect(width).toBeGreaterThanOrEqual(minimum);
      expect(width).toBeLessThanOrEqual(preferred);
      if (preferred > minimum) ratios.push((width - minimum) / (preferred - minimum));
    });
    ratios.forEach((ratio) => {
      expect(ratio).toBeGreaterThanOrEqual(0);
      expect(ratio).toBeLessThanOrEqual(1 + 1e-12);
      expect(ratio).toBeCloseTo(ratios[0], 10);
    });
  }
});
