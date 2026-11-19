import { describe, expect, it, vi } from 'vitest';

import { mergeRefs } from '../merge-refs';

describe('Scrollbar ref composition', () => {
  it('preserves the consumer disposer and clears object refs exactly once on detach', () => {
    const node = {};
    const cleanup = vi.fn();
    const consumer = vi.fn(() => cleanup);
    const internal = { current: null as object | null };
    const detach = mergeRefs(internal, consumer)(node);
    expect(internal.current).toBe(node);
    expect(consumer).toHaveBeenCalledExactlyOnceWith(node);
    if (typeof detach !== 'function') throw new Error('Missing composed ref disposer.');
    detach();
    detach();
    expect(internal.current).toBe(null);
    expect(cleanup).toHaveBeenCalledTimes(1);
    expect(consumer).toHaveBeenCalledTimes(1);
  });

  it('retains legacy callback(null), supports absent refs and StrictMode attach cycles', () => {
    const consumer = vi.fn(() => undefined);
    const node = {};
    const composed = mergeRefs(undefined, null, consumer);
    for (let cycle = 0; cycle < 2; cycle++) {
      const detach = composed(node);
      if (typeof detach !== 'function') throw new Error('Missing composed ref disposer.');
      detach();
    }
    expect(consumer.mock.calls).toEqual([[node], [null], [node], [null]]);
  });

  it('detaches an old consumer before attaching its replacement to the same root', () => {
    const node = {};
    const firstCleanup = vi.fn();
    const first = vi.fn(() => firstCleanup);
    const secondCleanup = vi.fn();
    const second = vi.fn(() => secondCleanup);
    const internal = { current: null as object | null };
    const detachFirst = mergeRefs(internal, first)(node);
    if (typeof detachFirst !== 'function') throw new Error('Missing composed ref disposer.');
    detachFirst();
    const detachSecond = mergeRefs(internal, second)(node);
    expect(internal.current).toBe(node);
    expect(firstCleanup).toHaveBeenCalledTimes(1);
    expect(secondCleanup).not.toHaveBeenCalled();
    if (typeof detachSecond !== 'function') throw new Error('Missing composed ref disposer.');
    detachSecond();
    expect(secondCleanup).toHaveBeenCalledTimes(1);
    expect(internal.current).toBe(null);
  });
});
