import { describe, expect, it } from 'vitest';

import { projectColumns, tableLayout } from '../geometry/table-layout';
import { automatic, resize, resizeDirections, sharedLayout } from '../layout/column-layout';
import { initializePins, resizePin } from '../pinning';

import type { GeometryColumn } from '../layout/types';
import type { PinColumn } from '../pinning';

const auto = (id: string, floor = 0, manual?: number): GeometryColumn => ({
  id,
  mode: 'auto',
  width: 0,
  floor,
  max: Infinity,
  manual,
  resizable: true,
});
const fixed = (id: string, width: number): GeometryColumn => ({
  id,
  mode: 'fixed',
  width,
  floor: 0,
  max: Infinity,
  resizable: true,
});
const VIEWPORT = { width: 1000, reserve: 50 };

describe('Table layout composition', () => {
  it('matches the ordinary automatic layout without pin, including manual overflow', () => {
    const columns = [fixed('code', 200), auto('name', 100, 950), fixed('actions', 80)];
    const ordinary = automatic(columns, VIEWPORT.width);
    const layout = tableLayout(columns, [], VIEWPORT);
    expect(layout.center.layout).toEqual(ordinary);
    expect(layout.columns.map((column) => column.width)).toEqual(ordinary.widths);
    expect(layout).toMatchObject({ total: ordinary.total, overflow: ordinary.overflow, underfill: ordinary.underfill });
    expect(layout.regions).toEqual({
      left: { start: 0, end: 0 },
      center: { start: 0, end: 1000 },
      right: { start: 1000, end: 1000 },
    });
    expect(projectColumns(layout, 150).map((column) => column.displayOffset)).toEqual([-150, 50, 1000]);
  });

  it('matches sharedLayout without pin on a wider nested surface', () => {
    const columns = [fixed('code', 200), auto('name', 100, 650)];
    const layout = tableLayout(columns, [], { width: 600, reserve: 50, surfaceWidth: 1200 });
    expect(layout.center.layout).toEqual(sharedLayout(columns, 1200, 600));
    expect(layout).toMatchObject({ total: 1200, overflow: 600, underfill: 0 });
  });

  it('orders L/C/R by schema, resolves pin by id, and ignores the ordinary widths of pin', () => {
    const columns = [
      fixed('r2', 9000),
      auto('c1'),
      auto('l2', 0, 1e6),
      fixed('l1', 8000),
      fixed('r1', 7000),
      fixed('c2', 100),
    ];
    const pins: PinColumn[] = [
      { id: 'r1', side: 'right', width: 70 },
      { id: 'l1', side: 'left', width: 120 },
      { id: 'r2', side: 'right', width: 80 },
      { id: 'l2', side: 'left', width: 130 },
    ];
    const layout = tableLayout(columns, pins, VIEWPORT);
    expect(
      layout.columns.map(({ id, sourceIndex, region, width, offset, regionOffset }) => [
        id,
        sourceIndex,
        region,
        width,
        offset,
        regionOffset,
      ]),
    ).toEqual([
      ['l2', 2, 'left', 130, 0, 0],
      ['l1', 3, 'left', 120, 130, 130],
      ['c1', 1, 'center', 500, 250, 0],
      ['c2', 5, 'center', 100, 750, 500],
      ['r2', 0, 'right', 80, 850, 0],
      ['r1', 4, 'right', 70, 930, 80],
    ]);
    expect(layout.center.columns.map((column) => column.id)).toEqual(['c1', 'c2']);
    expect(layout.center).toMatchObject({ availableWidth: 600, surfaceWidth: 600 });
    expect(layout.total).toBe(1000);
    expect(layout.regions).toEqual({
      left: { start: 0, end: 250 },
      center: { start: 250, end: 850 },
      right: { start: 850, end: 1000 },
    });
    expect(projectColumns(layout, 200).map(({ displayOffset }) => displayOffset)).toEqual([0, 130, 50, 550, 850, 930]);
    expect(projectColumns(layout, 200).map(({ shift }) => shift)).toEqual([200, 200, 0, 0, 200, 200]);
    for (const scroll of [0, 200, 700, 10, 0])
      expect(projectColumns(layout, scroll).map(({ pinInset }) => pinInset)).toEqual([
        0,
        130,
        undefined,
        undefined,
        70,
        0,
      ]);
  });

  it('keeps fixed/min/manual requests and reports the same overflow for table and center', () => {
    const columns = [fixed('left', 1e5), fixed('code', 400), auto('name', 500, 800), fixed('right', 1e5)];
    const pins: PinColumn[] = [
      { id: 'left', side: 'left', width: 200 },
      { id: 'right', side: 'right', width: 100 },
    ];
    const layout = tableLayout(columns, pins, VIEWPORT);
    expect(layout.center.layout).toMatchObject({ base: [400, 500], widths: [400, 800], total: 1200, overflow: 500 });
    expect(layout).toMatchObject({ total: 1500, overflow: 500 });
    expect(projectColumns(layout, 500).map((column) => column.displayOffset)).toEqual([0, -300, 100, 900]);
    expect(columns[2].manual).toBe(800);
  });

  it('uses the visible width for pin budget and the assigned surface only for center filling', () => {
    const columns = [fixed('left', 200), auto('name', 100), fixed('right', 100)];
    const pins: PinColumn[] = [
      { id: 'left', side: 'left', width: 200 },
      { id: 'right', side: 'right', width: 100 },
    ];
    const layout = tableLayout(columns, pins, { width: 600, reserve: 50, surfaceWidth: 1400 });
    expect(layout.pins).toMatchObject({ budget: 550, centerWidth: 300, remaining: 250 });
    expect(layout.center).toMatchObject({ availableWidth: 300, surfaceWidth: 1100 });
    expect(layout.center.layout).toMatchObject({ widths: [1100], total: 1100 });
    expect(layout).toMatchObject({ total: 1400, overflow: 800 });
    expect(projectColumns(layout, 800).map((column) => column.displayOffset)).toEqual([0, -600, 500]);
    expect(() =>
      tableLayout(columns, [{ ...pins[0], width: 600 }, pins[1]], { width: 600, reserve: 50, surfaceWidth: 1400 }),
    ).toThrow(/budget/);
  });

  it('integrates initialized widths and independent pin resizing without mutating ordinary state', () => {
    const columns = [fixed('left', 9000), auto('center'), auto('right', 0, 8000)];
    const pinned = initializePins([], VIEWPORT, [
      { id: 'left', side: 'left', minWidth: 100, source: { mode: 'fixed', declaredWidth: 600 } },
      { id: 'right', side: 'right', minWidth: 100, source: { mode: 'auto', base: 600 } },
    ]);
    const before = tableLayout(columns, pinned.columns, VIEWPORT);
    expect(before.columns.map((column) => column.width)).toEqual([475, 50, 475]);
    const shrunk = resizePin(pinned.columns, VIEWPORT, 'left', 200);
    const afterShrink = tableLayout(columns, shrunk.columns, VIEWPORT);
    expect(afterShrink.columns.map((column) => column.width)).toEqual([200, 325, 475]);
    const grown = resizePin(shrunk.columns, VIEWPORT, 'right', 5000);
    expect(tableLayout(columns, grown.columns, VIEWPORT).columns.map((column) => column.width)).toEqual([200, 50, 750]);
    expect(columns.map((column) => [column.width, column.manual])).toEqual([
      [9000, undefined],
      [0, undefined],
      [0, 8000],
    ]);
  });

  it('passes a center-only anchor through a viewport round trip', () => {
    const columns = [
      fixed('left', 9000),
      fixed('code', 200),
      auto('name', 100),
      auto('extra', 100),
      fixed('right', 9000),
    ];
    const pins: PinColumn[] = [
      { id: 'left', side: 'left', width: 100 },
      { id: 'right', side: 'right', width: 100 },
    ];
    const first = tableLayout(columns, pins, VIEWPORT);
    const resized = resize([...first.center.columns], first.center.layout, 800, 0, 400);
    const anchor = { container: 800, bases: resized.layout.base };
    const nextColumns = [columns[0], ...resized.columns, columns[4]];
    const restored = tableLayout(nextColumns, pins, VIEWPORT, anchor);
    expect(restored.center.layout).toEqual(resized.layout);
    const small = tableLayout(nextColumns, pins, { width: 900, reserve: 50 }, anchor);
    expect(small.center.layout).toEqual(automatic(resized.columns, 700, anchor));
    tableLayout(nextColumns, pins, { width: 1200, reserve: 50 }, anchor);
    expect(tableLayout(nextColumns, pins, VIEWPORT, anchor).center.layout).toEqual(resized.layout);
  });

  it('excludes pin from directed compensation and the center last-column rule', () => {
    const columns = [auto('left', 0, 9000), fixed('code', 200), auto('name', 100), auto('right', 0, 8000)];
    const pins: PinColumn[] = [
      { id: 'left', side: 'left', width: 100 },
      { id: 'right', side: 'right', width: 100 },
    ];
    const first = tableLayout(columns, pins, VIEWPORT);
    const resized = resize([...first.center.columns], first.center.layout, 800, 0, 950);
    const next = tableLayout([columns[0], ...resized.columns, columns[3]], pins, VIEWPORT, {
      container: 800,
      bases: resized.layout.base,
    });
    expect(next.columns.map((column) => column.width)).toEqual([100, 950, 100, 100]);
    expect(next.pins).toEqual(first.pins);
    expect(next.center.columns.map((column) => column.id)).toEqual(['code', 'name']);
    expect(resizeDirections([...next.center.columns], next.center.layout, 800, 1)).toEqual({
      left: false,
      right: false,
    });
  });

  it('preserves fractional logical widths and fixed edge projection', () => {
    const columns = [fixed('left', 9999), auto('name'), fixed('right', 9999)];
    const pins: PinColumn[] = [
      { id: 'left', side: 'left', width: 120.125 },
      { id: 'right', side: 'right', width: 80.375 },
    ];
    const layout = tableLayout(columns, pins, { width: 829.6, reserve: 50.25 });
    expect(layout.columns[0].width).toBe(120.125);
    expect(layout.columns[1].width).toBeCloseTo(629.1, 10);
    expect(layout.columns[2].width).toBe(80.375);
    const projected = projectColumns(layout, 17.75);
    expect(projected[0].displayOffset).toBe(0);
    expect(projected[1].displayOffset).toBe(102.375);
    expect(projected[2].displayOffset).toBeCloseTo(749.225, 10);
    expect(layout.total).toBeCloseTo(829.6, 10);
  });

  it('does not mutate frozen inputs when calculating or projecting repeatedly', () => {
    const columns = [Object.freeze(fixed('left', 9000)), Object.freeze(auto('name', 10, 1200))];
    const pins = [Object.freeze({ id: 'left', side: 'left' as const, width: 100 })];
    const anchor = Object.freeze({ container: 900, bases: [900] });
    Object.freeze(anchor.bases);
    Object.freeze(columns);
    Object.freeze(pins);
    const layout = tableLayout(columns, pins, Object.freeze(VIEWPORT), anchor);
    const before = structuredClone(layout);
    for (const scroll of [0, 100, 5000, -100, 0]) projectColumns(layout, scroll);
    expect(layout).toEqual(before);
    expect(columns[1].manual).toBe(1200);
    expect(pins[0].width).toBe(100);
  });

  it('rejects duplicate schema ids, duplicate pin ids and unknown pin ids', () => {
    expect(() => tableLayout([auto('a'), auto('a')], [], VIEWPORT)).toThrow(/Duplicate/);
    expect(() =>
      tableLayout(
        [auto('a'), fixed('b', 200)],
        [
          { id: 'b', side: 'left', width: 100 },
          { id: 'b', side: 'right', width: 100 },
        ],
        VIEWPORT,
      ),
    ).toThrow(/Duplicate/);
    expect(() => tableLayout([auto('a')], [{ id: 'missing', side: 'left', width: 100 }], VIEWPORT)).toThrow(/Unknown/);
  });

  it('rejects infeasible pin after viewport shrink without changing any state', () => {
    const columns = [fixed('left', 200), auto('center'), fixed('right', 200)];
    const pins: PinColumn[] = [
      { id: 'left', side: 'left', width: 200 },
      { id: 'right', side: 'right', width: 200 },
    ];
    const before = structuredClone({ columns, pins });
    expect(() => tableLayout(columns, pins, { width: 425, reserve: 50 })).toThrow(/budget/);
    expect({ columns, pins }).toEqual(before);
    expect(tableLayout(columns, pins, VIEWPORT).total).toBe(1000);
  });

  it('keeps schemes without a center auto unsupported instead of synthesizing a filler', () => {
    expect(() =>
      tableLayout([auto('pinned'), fixed('center', 900)], [{ id: 'pinned', side: 'left', width: 100 }], VIEWPORT),
    ).toThrow(/automatic/);
    expect(() => tableLayout([auto('pinned')], [{ id: 'pinned', side: 'left', width: 100 }], VIEWPORT)).toThrow(
      /automatic/,
    );
    expect(() => tableLayout([fixed('only', 2000)], [], VIEWPORT)).toThrow(/automatic/);
  });

  it('propagates impossible center fill without stretching pin beyond its saved width', () => {
    const columns = [fixed('left', 100), { ...auto('center'), max: 200 }];
    const pins: PinColumn[] = [{ id: 'left', side: 'left', width: 100 }];
    expect(() => tableLayout(columns, pins, VIEWPORT)).toThrow(/fill/);
    expect(pins[0].width).toBe(100);
  });

  it.each([NaN, Infinity, -1, 999])('rejects invalid assigned surface %s', (surfaceWidth) => {
    expect(() => tableLayout([auto('name')], [], { ...VIEWPORT, surfaceWidth })).toThrow(/surface/i);
  });

  it('rejects a full-schema anchor that does not match the center', () => {
    expect(() =>
      tableLayout([fixed('pin', 100), auto('center')], [{ id: 'pin', side: 'left', width: 100 }], VIEWPORT, {
        container: 1000,
        bases: [100, 900],
      }),
    ).toThrow(/anchor/i);
  });

  it.each(['left', 'right'] as const)('projects a single %s pin against its own edge', (side) => {
    const layout = tableLayout([auto('center'), fixed('pin', 9999)], [{ id: 'pin', side, width: 200 }], VIEWPORT);
    expect(layout.center.layout.widths).toEqual([800]);
    const projected = projectColumns(layout, 350);
    expect(projected.find((column) => column.id === 'pin')?.displayOffset).toBe(side === 'left' ? 0 : 800);
    expect(projected.find((column) => column.id === 'center')?.displayOffset).toBe(side === 'left' ? -150 : -350);
  });

  it('keeps clips non-overlapping at a floating-point budget boundary without rounding pin widths', () => {
    const pins: PinColumn[] = [
      { id: 'l', side: 'left', width: 0.1 },
      { id: 'r1', side: 'right', width: 0.2 },
      { id: 'r2', side: 'right', width: 0.3 },
    ];
    const layout = tableLayout([auto('l'), auto('center'), auto('r1'), auto('r2')], pins, { width: 0.6, reserve: 0 });
    expect(layout.columns.filter((column) => column.region !== 'center').map((column) => column.width)).toEqual([
      0.1, 0.2, 0.3,
    ]);
    expect(layout.regions.left.end).toBe(layout.regions.center.start);
    expect(layout.regions.center.end).toBeGreaterThanOrEqual(layout.regions.center.start);
    expect(layout.regions.center.end).toBe(layout.regions.right.start);
    expect(layout.regions.right.end).toBe(0.6);
  });

  it('retains each zero-width column once and supports a zero viewport with zero reserve', () => {
    const layout = tableLayout(
      [fixed('l', 0), auto('a'), fixed('b', 0), fixed('r', 0)],
      [
        { id: 'l', side: 'left', width: 0 },
        { id: 'r', side: 'right', width: 0 },
      ],
      { width: 0, reserve: 0 },
    );
    expect(layout.columns.map((column) => column.id)).toEqual(['l', 'a', 'b', 'r']);
    expect(layout.columns.map((column) => column.width)).toEqual([0, 0, 0, 0]);
    expect(layout).toMatchObject({ total: 0, overflow: 0, underfill: 0 });
    expect(projectColumns(layout, 0).every((column) => column.displayOffset === 0)).toBe(true);
  });

  it('does not depend on pin-state storage order', () => {
    const columns = [auto('center'), fixed('l1', 9000), fixed('r', 9000), fixed('l2', 9000)];
    const pins: PinColumn[] = [
      { id: 'l1', side: 'left', width: 100 },
      { id: 'r', side: 'right', width: 200 },
      { id: 'l2', side: 'left', width: 300 },
    ];
    expect(tableLayout(columns, pins, VIEWPORT)).toEqual(tableLayout(columns, pins.toReversed(), VIEWPORT));
  });

  it('sums fractional pin in schema order regardless of state storage order', () => {
    const columns = [auto('center'), fixed('l1', 9000), fixed('l2', 9000), fixed('l3', 9000)];
    const pins: PinColumn[] = [
      { id: 'l1', side: 'left', width: 0.1 },
      { id: 'l2', side: 'left', width: 0.2 },
      { id: 'l3', side: 'left', width: 0.3 },
    ];
    expect(tableLayout(columns, pins, VIEWPORT)).toEqual(tableLayout(columns, pins.toReversed(), VIEWPORT));
  });

  it.each([
    { width: NaN, reserve: 0 },
    { width: Infinity, reserve: 0 },
    { width: -1, reserve: 0 },
    { width: 100, reserve: NaN },
    { width: 100, reserve: -1 },
    { width: 100, reserve: 101 },
  ])('validates viewport even with no pin: %j', (viewport) => {
    expect(() => tableLayout([auto('center')], [], viewport)).toThrow();
  });
});

describe('Table viewport projection', () => {
  it('clips center content and pointer regions behind either pin without clipping the pin groups', () => {
    const layout = tableLayout(
      [fixed('left', 100), auto('center', 0, 1000), fixed('right', 100)],
      [
        { id: 'left', side: 'left', width: 100 },
        { id: 'right', side: 'right', width: 100 },
      ],
      { width: 600, reserve: 50 },
    );
    for (const [scroll, left, right] of [
      [0, 0, 600],
      [250, 250, 350],
      [600, 600, 0],
      [1200, 1000, 0],
    ]) {
      const projected = projectColumns(layout, scroll);
      expect(projected[1]).toMatchObject({ clipLeft: left, clipRight: right });
      expect(projected[0]).toMatchObject({ clipLeft: 0, clipRight: 0 });
      expect(projected[2]).toMatchObject({ clipLeft: 0, clipRight: 0 });
    }
  });

  it('fully clips overscan columns beyond the right edge without negative or overlapping insets', () => {
    const layout = tableLayout(
      [fixed('left', 100), fixed('a', 500), fixed('b', 500), auto('fill', 100), fixed('right', 100)],
      [
        { id: 'left', side: 'left', width: 100 },
        { id: 'right', side: 'right', width: 100 },
      ],
      { width: 600, reserve: 50 },
    );
    const projected = projectColumns(layout, 0);
    expect(projected.find((column) => column.id === 'b')).toMatchObject({ clipLeft: 0, clipRight: 500 });
    projected.forEach((column) => {
      expect(column.clipLeft).toBeGreaterThanOrEqual(0);
      expect(column.clipRight).toBeGreaterThanOrEqual(0);
      expect(column.clipLeft + column.clipRight).toBeLessThanOrEqual(column.width);
    });
  });
  it('keeps right pins on screen even when center widths dwarf viewport precision', () => {
    const layout = tableLayout(
      [auto('center', 0, 1e20), fixed('r1', 80), fixed('r2', 40)],
      [
        { id: 'r1', side: 'right', width: 80 },
        { id: 'r2', side: 'right', width: 40 },
      ],
      VIEWPORT,
    );
    expect(projectColumns(layout, 1e20).map((column) => column.displayOffset)).toEqual([-1e20, 880, 960]);
  });

  it('does not clamp a shared scroll coordinate to the local table overflow', () => {
    const layout = tableLayout(
      [fixed('left', 100), auto('center'), fixed('right', 100)],
      [
        { id: 'left', side: 'left', width: 100 },
        { id: 'right', side: 'right', width: 100 },
      ],
      VIEWPORT,
    );
    expect(layout.overflow).toBe(0);
    expect(projectColumns(layout, 2500).map((column) => column.displayOffset)).toEqual([0, -2400, 900]);
    expect(projectColumns(layout, -20).map((column) => column.displayOffset)).toEqual([0, 120, 900]);
  });

  it.each([NaN, Infinity, -Infinity])('rejects non-finite scroll %s', (scroll) => {
    expect(() => projectColumns(tableLayout([auto('name')], [], VIEWPORT), scroll)).toThrow(/scroll/i);
  });

  it('rejects unrepresentable projection offsets instead of returning Infinity', () => {
    const layout = tableLayout(
      [auto('center', 0, 1e308), fixed('right', 100)],
      [{ id: 'right', side: 'right', width: 100 }],
      VIEWPORT,
    );
    expect(() => projectColumns(layout, -1e308)).toThrow(/offsets.*finite/i);
  });
});

it('preserves composition invariants across 2000 seeded independent pin resizes and scrolls', () => {
  let seed = 271828;
  const random = () => (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296;
  for (let scenario = 0; scenario < 200; scenario++) {
    const viewport = { width: 600 + random() * 1000, reserve: 25 + random() * 50 };
    const columns = [
      fixed('l1', 10000),
      fixed('code', 50 + random() * 600),
      auto('name', random() * 100, random() * 2000),
      auto('l2', 0, 20000),
      auto('extra', random() * 100),
      fixed('right', 10000),
    ];
    const source = structuredClone(columns);
    let pins: readonly PinColumn[] = [
      { id: 'l1', side: 'left', width: 50, minWidth: 25 },
      { id: 'l2', side: 'left', width: 75, minWidth: 25 },
      { id: 'right', side: 'right', width: 100, minWidth: 50 },
    ];
    for (let step = 0; step < 10; step++) {
      const id = pins[Math.floor(random() * pins.length)].id;
      const before = pins;
      pins = resizePin(pins, viewport, id, random() * 2000).columns;
      const layout = tableLayout(columns, pins, viewport);
      expect(layout.total).toBeGreaterThanOrEqual(viewport.width - 1e-6);
      expect(layout.pins.centerWidth).toBeGreaterThanOrEqual(viewport.reserve - 1e-6);
      expect(layout.overflow).toBeCloseTo(layout.center.layout.overflow, 8);
      expect(layout.regions.center.end - layout.regions.center.start).toBeCloseTo(layout.pins.centerWidth, 8);
      expect(layout.center.columns.map((column) => column.id)).toEqual(['code', 'name', 'extra']);
      expect(layout.columns.map((column) => column.id)).toEqual(['l1', 'l2', 'code', 'name', 'extra', 'right']);
      const centerTotal = layout.center.layout.widths.reduce((sum, width) => sum + width, 0);
      expect(layout.total).toBeCloseTo(layout.pins.totalWidth + centerTotal, 8);
      for (const pin of pins) {
        expect(layout.columns.find((column) => column.id === pin.id)?.width).toBe(pin.width);
        if (pin.id !== id) expect(pin).toBe(before.find((column) => column.id === pin.id));
      }
      const scroll = random() * (layout.overflow + 2000);
      const start = projectColumns(layout, 0);
      const end = projectColumns(layout, scroll);
      end.forEach((column, index) => {
        expect(column.width).toBe(start[index].width);
        if (column.region === 'center')
          expect(column.displayOffset).toBeCloseTo(start[index].displayOffset - scroll, 8);
        else expect(column.displayOffset).toBe(start[index].displayOffset);
      });
      expect(columns).toEqual(source);
    }
  }
});
