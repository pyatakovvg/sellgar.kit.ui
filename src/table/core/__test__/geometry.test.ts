import { describe, expect, it } from 'vitest';

import { Axis } from '../geometry/axis';
import { headerViewportTop } from '../geometry/header';
import { automatic, resize, resizeDirections } from '../layout/column-layout';

import type { GeometryColumn } from '../layout/types';

const fixed = (id: string, width = 200): GeometryColumn => ({
  id,
  mode: 'fixed',
  resizable: true,
  width,
  floor: 60,
  max: 1400,
});
const auto = (id: string, floor = 200, max = Infinity): GeometryColumn => ({
  id,
  mode: 'auto',
  resizable: true,
  width: 0,
  floor,
  max,
});

describe('Table column geometry', () => {
  it('rejects geometry without an automatic column even if fixed columns overflow the container', () => {
    expect(() => automatic([fixed('code', 600), fixed('price', 600)], 1000)).toThrow(/automatic/);
  });
  it('keeps the left side unchanged and compensates only from automatic columns to the right', () => {
    const columns = [fixed('code'), auto('name'), fixed('price')];
    const before = automatic(columns, 1000);
    const next = resize(columns, before, 1000, 0, 700);
    expect(before.widths).toEqual([200, 600, 200]);
    expect(next.layout.widths).toEqual([700, 200, 200]);
    expect(next.layout.total).toBe(1100);
    expect(columns[0].width).toBe(200);
    expect(next.columns[0].width).toBe(700);
  });

  it('keeps an automatic column automatic and clears its manual width on return to base', () => {
    const columns = [auto('name'), fixed('price', 400)];
    const expanded = resize(columns, automatic(columns, 1000), 1000, 0, 700);
    expect(expanded.columns[0]).toMatchObject({ mode: 'auto', manual: 700 });
    expect(automatic(expanded.columns, 1200).widths).toEqual([800, 400]);
    const returned = resize(expanded.columns, expanded.layout, 1000, 0, 600);
    expect(returned.columns[0].manual).toBeUndefined();
    expect(resizeDirections(returned.columns, returned.layout, 1000, 0)).toEqual({ left: false, right: true });
    expect(resizeDirections(returned.columns, returned.layout, 1000, 1)).toEqual({ left: false, right: false });
  });

  it('stops shrinking when right-side capacity and removable overflow are exhausted', () => {
    const columns = [fixed('code', 400), auto('name', 200, 650)];
    const next = resize(columns, automatic(columns, 1000), 1000, 0, 100);
    expect(next.layout.widths).toEqual([350, 650]);
    expect(next.layout.total).toBe(1000);
    expect(resizeDirections(next.columns, next.layout, 1000, 0)).toEqual({ left: false, right: true });
  });

  it('fills a fractional container and rejects infeasible finite maxima', () => {
    const columns = [auto('name'), fixed('price')];
    const layout = automatic(columns, 829.6);
    expect(layout.total).toBeCloseTo(829.6, 9);
    expect(layout.widths[0]).toBeCloseTo(629.6, 9);
    expect(() => automatic([fixed('code', 400), auto('name', 200, 500)], 1000)).toThrow(/fill/);
  });

  it('preserves the directed reference across a container round trip', () => {
    const columns = [fixed('code'), auto('name'), fixed('price')];
    const next = resize(columns, automatic(columns, 1000), 1000, 0, 700);
    const anchor = { container: 1000, bases: next.layout.base };
    expect(automatic(next.columns, 1000, anchor).widths).toEqual(next.layout.widths);
    automatic(next.columns, 900, anchor);
    automatic(next.columns, 1200, anchor);
    expect(automatic(next.columns, 1000, anchor).widths).toEqual(next.layout.widths);
  });
});

describe('Table axes and header geometry', () => {
  it('matches prefix sums and inverse lookup after height updates, including zero-height entries', () => {
    const sizes = Array.from({ length: 512 }, (_, index) => (index % 11 ? (index % 70) + 1 : 0));
    const axis = new Axis(sizes);
    for (let index = 0; index < sizes.length; index += 3) {
      sizes[index] = index % 97;
      axis.set(index, sizes[index]);
    }
    let offset = 0;
    sizes.forEach((size, index) => {
      expect(axis.offset(index)).toBe(offset);
      if (size) expect(axis.at(offset + size / 2)).toBe(index);
      offset += size;
    });
    expect(axis.at(axis.total)).toBe(-1);
    expect(axis.range(axis.total + 1, axis.total + 100)).toEqual([]);
  });

  it('keeps the header stationary while pinned and bounded by the table at both ends', () => {
    expect(headerViewportTop(0, 120, 48, 1048)).toBe(120);
    for (const scroll of [120, 121, 750, 1120]) expect(headerViewportTop(scroll, 120, 48, 1048)).toBe(0);
    expect(headerViewportTop(1200, 120, 48, 1048)).toBe(-80);
  });
});
