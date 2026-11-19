// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';

import { scrollFocusedElementIntoViewport } from '../focus-scroll';

const rect = (left: number, top: number, width: number, height: number) =>
  ({ left, top, right: left + width, bottom: top + height, width, height, x: left, y: top }) as DOMRect;

const port = (width = 300, height = 140, scale = 1, direction = 'ltr') => {
  const element = document.createElement('div');
  element.style.overflowX = 'auto';
  element.style.overflowY = 'auto';
  element.style.direction = direction;
  Object.defineProperties(element, {
    clientWidth: { value: width },
    clientHeight: { value: height },
    offsetWidth: { value: width, configurable: true },
    offsetHeight: { value: height, configurable: true },
    scrollWidth: { value: 900 },
    scrollHeight: { value: 850 },
  });
  element.getBoundingClientRect = () => rect(0, 0, width * scale, height * scale);
  element.scrollTo = ((options: ScrollToOptions) => {
    expect(options.behavior).toBe('instant');
    const minimum = direction === 'rtl' ? width - 900 : 0;
    element.scrollLeft = Math.max(minimum, Math.min(minimum + 900 - width, options.left ?? element.scrollLeft));
    element.scrollTop = Math.max(0, Math.min(850 - height, options.top ?? element.scrollTop));
  }) as HTMLElement['scrollTo'];
  document.body.append(element);
  return element;
};

const item = (owner: HTMLElement, x: number, y: number, width: number, height: number, scale = 1) => {
  const element = document.createElement('div');
  element.tabIndex = 0;
  element.getBoundingClientRect = () => {
    const area = owner.getBoundingClientRect();
    return rect(
      area.left + (x - owner.scrollLeft) * scale,
      area.top + (y - owner.scrollTop) * scale,
      width * scale,
      height * scale,
    );
  };
  owner.append(element);
  return element;
};

afterEach(() => document.body.replaceChildren());

describe('Scrollbar focus visibility', () => {
  it('keeps the horizontal position of a wide row while revealing it vertically', () => {
    const viewport = port();
    const target = item(viewport, 0, 300, 680, 36);
    viewport.scrollLeft = 120;
    scrollFocusedElementIntoViewport(viewport, target);
    expect(viewport.scrollLeft).toBe(120);
    expect(viewport.scrollTop).toBe(196);
  });

  it('reveals a small hidden control with the minimum movement on each axis', () => {
    const viewport = port();
    const target = item(viewport, 460, 320, 180, 32);
    scrollFocusedElementIntoViewport(viewport, target);
    expect([viewport.scrollLeft, viewport.scrollTop]).toEqual([340, 212]);
    expect(scrollFocusedElementIntoViewport(viewport, target)).toBe(false);
  });

  it('preserves the position of visible ordinary controls', () => {
    const viewport = port();
    expect(scrollFocusedElementIntoViewport(viewport, item(viewport, 30, 30, 180, 32))).toBe(false);
    expect([viewport.scrollLeft, viewport.scrollTop]).toEqual([0, 0]);
  });

  it.each([
    [299, 0, 299],
    [460, 0, 460],
    [0, 560, 120],
  ])('shows the nearest edge of a large block at x=%s from scroll=%s', (x, initial, expected) => {
    const viewport = port();
    const target = item(viewport, x, 20, 420, 40);
    viewport.scrollLeft = initial;
    scrollFocusedElementIntoViewport(viewport, target);
    expect(viewport.scrollLeft).toBe(expected);
  });

  it('keeps a tall block covering the viewport and reveals the start of one below it', () => {
    const viewport = port();
    const target = item(viewport, 20, 0, 220, 420);
    viewport.scrollTop = 60;
    scrollFocusedElementIntoViewport(viewport, target);
    expect(viewport.scrollTop).toBe(60);
    const lower = item(viewport, 20, 500, 220, 420);
    scrollFocusedElementIntoViewport(viewport, lower);
    expect(viewport.scrollTop).toBe(500);
  });

  it('converts screen deltas into scroll units under scale', () => {
    const viewport = port(300, 140, 0.75);
    scrollFocusedElementIntoViewport(viewport, item(viewport, 460, 320, 180, 32, 0.75));
    expect([viewport.scrollLeft, viewport.scrollTop]).toEqual([340, 212]);
  });

  it('uses the inner client area excluding a scaled border', () => {
    const viewport = port(300, 140, 0.75);
    Object.defineProperties(viewport, { clientLeft: { value: 4 }, clientTop: { value: 4 } });
    viewport.getBoundingClientRect = () => rect(0, 0, 231, 111);
    Object.defineProperties(viewport, {
      offsetWidth: { value: 308, configurable: true },
      offsetHeight: { value: 148, configurable: true },
    });
    const target = item(viewport, 295, 10, 10, 32, 0.75);
    scrollFocusedElementIntoViewport(viewport, target);
    expect([viewport.scrollLeft, viewport.scrollTop]).toEqual([1, 0]);
  });

  it('handles RTL using physical screen movement', () => {
    const viewport = port(300, 140, 1, 'rtl');
    viewport.scrollLeft = -600;
    const target = item(viewport, -580, 30, 180, 32);
    scrollFocusedElementIntoViewport(viewport, target);
    expect(viewport.scrollLeft).toBe(-600);
    const hidden = item(viewport, -140, 30, 180, 32);
    scrollFocusedElementIntoViewport(viewport, hidden);
    expect(viewport.scrollLeft).toBe(-260);
  });

  it('reveals a nested control inside first without dragging the outer viewport away', () => {
    const outer = port();
    const inner = port(240, 100);
    outer.append(inner);
    inner.getBoundingClientRect = () => rect(20 - outer.scrollLeft, 25 - outer.scrollTop, 240, 100);
    const target = item(inner, 360, 200, 160, 32);
    scrollFocusedElementIntoViewport(outer, target);
    expect([inner.scrollLeft, inner.scrollTop]).toEqual([280, 132]);
    expect([outer.scrollLeft, outer.scrollTop]).toEqual([0, 0]);
  });

  it('reveals the clipped part of a wide nested row rather than its hidden content', () => {
    const outer = port();
    const inner = port(240, 100);
    outer.append(inner);
    inner.getBoundingClientRect = () => rect(220 - outer.scrollLeft, 25 - outer.scrollTop, 240, 100);
    const target = item(inner, 0, 20, 680, 36);
    scrollFocusedElementIntoViewport(outer, target);
    expect(inner.scrollLeft).toBe(0);
    expect(outer.scrollLeft).toBe(160);
  });

  it('does not move the outer viewport toward content hidden by a non-scrollable clip', () => {
    const outer = port();
    const clip = document.createElement('div');
    clip.style.overflowX = 'clip';
    clip.style.overflowY = 'clip';
    Object.defineProperties(clip, {
      clientWidth: { value: 100 },
      clientHeight: { value: 100 },
      offsetWidth: { value: 100 },
      offsetHeight: { value: 100 },
    });
    clip.getBoundingClientRect = () => rect(20, 20, 100, 100);
    outer.append(clip);
    const target = item(clip, 400, 200, 160, 32);
    expect(scrollFocusedElementIntoViewport(outer, target)).toBe(false);
    expect([outer.scrollLeft, outer.scrollTop]).toEqual([0, 0]);
  });

  it('ignores targets outside the owned viewport', () => {
    const viewport = port();
    const unrelated = item(port(), 460, 320, 180, 32);
    expect(scrollFocusedElementIntoViewport(viewport, unrelated)).toBe(false);
    expect([viewport.scrollLeft, viewport.scrollTop]).toEqual([0, 0]);
  });
});
