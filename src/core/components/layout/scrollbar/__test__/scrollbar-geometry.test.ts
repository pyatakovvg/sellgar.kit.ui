// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';

import { measureScrollbarLayout, measureScrollbarTrack, placeScrollbarTrack } from '../geometry';

const box = (element: HTMLElement, left: number, top: number, width: number, height: number, scale = 1) => {
  Object.defineProperties(element, {
    clientLeft: { value: 0 },
    clientTop: { value: 0 },
    clientWidth: { value: width },
    clientHeight: { value: height },
    offsetWidth: { value: width },
    offsetHeight: { value: height },
  });
  element.getBoundingClientRect = () =>
    DOMRect.fromRect({ x: left, y: top, width: width * scale, height: height * scale });
  Object.assign(element.style, { transform: 'none', perspective: 'none', filter: 'none', backdropFilter: 'none' });
};

const fixture = (height = 900, rootScale = 1, hostScale = 1) => {
  const host = document.createElement('div');
  const viewport = document.createElement('div');
  const root = document.createElement('div');
  const verticalTrack = document.createElement('div');
  host.dataset.scrollbarId = 'outer';
  viewport.dataset.scrollbarViewport = 'outer';
  viewport.style.overflowX = 'auto';
  viewport.style.overflowY = 'auto';
  host.append(viewport);
  viewport.append(root);
  root.append(verticalTrack);
  document.body.append(host);
  box(host, 0, 0, 600, 300, hostScale);
  box(viewport, 0, 0, 600, 300, hostScale);
  box(root, 20, 10, 500, height, rootScale);
  verticalTrack.style.top = '18px';
  verticalTrack.style.width = '12px';
  const layout = {
    ...measureScrollbarLayout([viewport, host]),
    visualViewport: { left: 0, top: 0, right: 2000, bottom: 1000 },
  };
  return { host, viewport, root, layout, verticalTrack };
};

afterEach(() => document.body.replaceChildren());

describe('Scrollbar measured track placement', () => {
  it('uses resolved fractional token sizes instead of a 6px constant', () => {
    const { verticalTrack } = fixture();
    verticalTrack.style.top = '7.25px';
    verticalTrack.style.width = '4.75px';
    expect(measureScrollbarTrack(verticalTrack)).toEqual({ offset: 7.25, height: 4.75 });
  });

  it('uses source token metrics for the natural track', () => {
    const { root, layout, verticalTrack } = fixture(180);
    expect(placeScrollbarTrack(root, layout, measureScrollbarTrack(verticalTrack))).toMatchObject({
      geometry: { available: true, floating: false },
      host: null,
      left: 18,
      right: 18,
      bottom: 18,
      height: 12,
    });
  });

  it.each([
    [1, 1, 38, 464, 18, 12],
    [2, 1, 56, 508, 36, 24],
    [1, 2, 19, 232, 9, 6],
  ])(
    'converts source scale %s to host scale %s for floating offset, width and thickness',
    (rootScale, hostScale, left, width, bottom, height) => {
      const { root, layout, verticalTrack, host } = fixture(900, rootScale, hostScale);
      expect(placeScrollbarTrack(root, layout, measureScrollbarTrack(verticalTrack))).toMatchObject({
        geometry: { available: true, floating: true },
        host,
        position: 'absolute',
        left,
        width,
        bottom,
        height,
      });
    },
  );

  it('converts source metrics when floating against the window', () => {
    const { root, verticalTrack } = fixture(900, 2);
    const layout = {
      ...measureScrollbarLayout([]),
      visualViewport: { left: 0, top: 0, right: 2000, bottom: 500 },
    };
    expect(placeScrollbarTrack(root, layout, measureScrollbarTrack(verticalTrack))).toMatchObject({
      host: document.body,
      position: 'fixed',
      left: 56,
      width: 928,
      top: 440,
      height: 24,
    });
  });
});
