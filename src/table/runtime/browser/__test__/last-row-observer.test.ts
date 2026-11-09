// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { LastRowObserver } from '../last-row-observer';

let observers: {
  notify(target: Element, intersecting?: boolean, verticalRatio?: number, horizontalRatio?: number): void;
  options?: IntersectionObserverInit;
  disconnect: ReturnType<typeof vi.fn>;
  observe: ReturnType<typeof vi.fn>;
  unobserve: ReturnType<typeof vi.fn>;
}[];

beforeEach(() => {
  observers = [];
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      disconnect = vi.fn();
      observe = vi.fn();
      unobserve = vi.fn();
      constructor(
        callback: IntersectionObserverCallback,
        readonly options?: IntersectionObserverInit,
      ) {
        observers.push({
          options,
          disconnect: this.disconnect,
          observe: this.observe,
          unobserve: this.unobserve,
          notify: (target, isIntersecting = true, verticalRatio = 1, horizontalRatio = 1) =>
            callback(
              [
                {
                  target,
                  isIntersecting,
                  intersectionRatio: verticalRatio * horizontalRatio,
                  boundingClientRect: DOMRect.fromRect({ width: 2000, height: 54 }),
                  intersectionRect: DOMRect.fromRect({ width: 2000 * horizontalRatio, height: 54 * verticalRatio }),
                } as IntersectionObserverEntry,
              ],
              this as unknown as IntersectionObserver,
            ),
        });
      }
    },
  );
});

afterEach(() => vi.unstubAllGlobals());

describe('Last data row visibility', () => {
  it('observes the actual scroll owner and respects the configured intersection threshold', () => {
    const observer = new LastRowObserver();
    const cell = document.createElement('div');
    const root = document.createElement('div');
    const callback = vi.fn();
    observer.observe(cell, 'last', root, callback, { rootMargin: 120, threshold: 0.5 });
    expect(observers[0].observe).toHaveBeenCalledExactlyOnceWith(cell);
    expect(observers[0].options).toEqual({ root, rootMargin: '0px 0px 120px 0px', threshold: 0 });
    observers[0].notify(cell, true, 0.2);
    observers[0].notify(cell, false, 1);
    observers[0].notify(document.createElement('div'));
    expect(callback).not.toHaveBeenCalled();
    observers[0].notify(cell, true, 0.5);
    observers[0].notify(cell);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it.each([0.5, 1])(
    'uses vertical visibility at threshold %s even when most of the row is horizontally clipped',
    (threshold) => {
      const observer = new LastRowObserver();
      const row = document.createElement('div');
      const callback = vi.fn();
      observer.observe(row, 'wide-last', null, callback, { threshold });
      observers[0].notify(row, true, threshold / 2, 0.1);
      expect(callback).not.toHaveBeenCalled();
      observers[0].notify(row, true, threshold, 0.1);
      expect(callback).toHaveBeenCalledTimes(1);
    },
  );

  it('requests a fresh intersection after scrolling while below the vertical threshold, then stops after delivery', () => {
    const observer = new LastRowObserver();
    const row = document.createElement('div');
    const callback = vi.fn();
    observer.observe(row, 'last', null, callback, { threshold: 0.5 });
    observers[0].notify(row, true, 0.2, 0.1);
    observer.refresh();
    expect(observers[0].unobserve).toHaveBeenCalledExactlyOnceWith(row);
    expect(observers[0].observe).toHaveBeenCalledTimes(2);
    observers[0].notify(row, true, 0.5, 0.1);
    observer.refresh();
    expect(callback).toHaveBeenCalledTimes(1);
    expect(observers[0].observe).toHaveBeenCalledTimes(2);
    observer.clear();
    observer.refresh();
    expect(observers[0].observe).toHaveBeenCalledTimes(2);
  });

  it('does not repeat a loaded last row across virtual unmounts but notifies the appended row', () => {
    const observer = new LastRowObserver();
    const callback = vi.fn();
    const cell = document.createElement('div');
    observer.observe(cell, 'first-last', null, callback, {});
    observers[0].notify(cell);
    observer.clear();
    const remounted = document.createElement('div');
    observer.observe(remounted, 'first-last', null, callback, {});
    observers[1].notify(remounted);
    observer.observe(remounted, 'new-last', null, callback, {});
    observers[2].notify(remounted);
    expect(callback).toHaveBeenCalledTimes(2);
  });

  it('ignores queued callbacks after detach or target replacement and does not clear a newer observation', () => {
    const observer = new LastRowObserver();
    const cell = document.createElement('div');
    const previous = vi.fn();
    const current = vi.fn();
    const releasePrevious = observer.observe(cell, 'old', null, previous, {});
    observer.observe(cell, 'new', null, current, {});
    releasePrevious();
    observers[0].notify(cell);
    observers[1].notify(cell);
    expect(previous).not.toHaveBeenCalled();
    expect(current).toHaveBeenCalledTimes(1);
    expect(observers[1].disconnect).not.toHaveBeenCalled();
    observer.clear();
    expect(observers[1].disconnect).toHaveBeenCalledTimes(1);
  });

  it('uses one measured row height as the default prefetch margin', () => {
    const cell = document.createElement('div');
    cell.getBoundingClientRect = () => DOMRect.fromRect({ height: 54.25 });
    new LastRowObserver().observe(cell, 'row', null, vi.fn(), {});
    expect(observers[0].options).toEqual({ root: null, rootMargin: '0px 0px 55px 0px', threshold: 0 });
  });

  it('isolates deduplication between table instances and allows the latest row callback', () => {
    const cell = document.createElement('div');
    const first = new LastRowObserver();
    const second = new LastRowObserver();
    const oldCallback = vi.fn();
    const currentCallback = vi.fn();
    const secondCallback = vi.fn();
    first.observe(cell, 'same', null, oldCallback, {});
    first.observe(cell, 'same', null, currentCallback, {});
    second.observe(cell, 'same', null, secondCallback, {});
    observers[0].notify(cell);
    observers[1].notify(cell);
    observers[2].notify(cell);
    expect(oldCallback).not.toHaveBeenCalled();
    expect(currentCallback).toHaveBeenCalledTimes(1);
    expect(secondCallback).toHaveBeenCalledTimes(1);
  });

  it.each([{ rootMargin: NaN }, { threshold: -0.1 }, { threshold: 1.1 }])('rejects invalid options %j', (options) => {
    expect(() => new LastRowObserver().observe(document.createElement('div'), 'last', null, vi.fn(), options)).toThrow(
      RangeError,
    );
  });

  it('cleans up safely without IntersectionObserver support', () => {
    vi.stubGlobal('IntersectionObserver', undefined);
    const observer = new LastRowObserver();
    const release = observer.observe(document.createElement('div'), 'last', null, vi.fn(), {});
    release();
    observer.clear();
    expect(observers).toHaveLength(0);
  });
});
