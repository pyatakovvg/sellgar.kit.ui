import { describe, expect, it, vi } from 'vitest';

import { ColumnSort } from '../columns/column-sort';

describe('Table external sort requests', () => {
  it('uses the first default without issuing a data sorting request', () => {
    const sort = new ColumnSort();
    const first = { directionDefault: 'desc' as const, onToggle: vi.fn() };
    const second = { directionDefault: 'asc' as const, onToggle: vi.fn() };
    sort.configure([
      { id: 'price', config: first },
      { id: 'name', config: second },
    ]);
    expect(sort.getSnapshot()).toEqual({ columnId: 'price', direction: 'desc' });
    expect(first.onToggle).not.toHaveBeenCalled();
    expect(second.onToggle).not.toHaveBeenCalled();
  });

  it('toggles one column asc/desc and resets the previous column on switch', () => {
    const sort = new ColumnSort();
    const events: string[] = [];
    sort.configure(
      ['name', 'price'].map((id) => ({
        id,
        config: {
          onToggle: (direction) => events.push(`${id}:${direction}`),
          onReset: () => events.push(`${id}:reset`),
        },
      })),
    );
    sort.toggle('name');
    sort.toggle('name');
    sort.toggle('name');
    sort.toggle('price');
    expect(events).toEqual(['name:asc', 'name:desc', 'name:asc', 'name:reset', 'price:asc']);
    expect(sort.getSnapshot()).toEqual({ columnId: 'price', direction: 'asc' });
  });

  it('retains the user direction across renders and invokes the latest callbacks', () => {
    const sort = new ColumnSort();
    const previous = vi.fn();
    const current = vi.fn();
    sort.configure([{ id: 'name', config: { onToggle: previous } }]);
    sort.toggle('name');
    sort.configure([{ id: 'name', config: { directionDefault: 'desc', onToggle: current } }]);
    expect(sort.getSnapshot().direction).toBe('asc');
    sort.toggle('name');
    expect(current).toHaveBeenCalledExactlyOnceWith('desc');
    expect(previous).toHaveBeenCalledExactlyOnceWith('asc');
  });

  it('resets a removed, hidden or no longer sortable column and selects a remaining default', () => {
    const sort = new ColumnSort();
    const reset = vi.fn();
    const next = vi.fn();
    sort.configure([{ id: 'removed', config: { directionDefault: 'asc', onToggle: vi.fn(), onReset: reset } }]);
    sort.configure([{ id: 'next', config: { directionDefault: 'desc', onToggle: next } }]);
    expect(reset).toHaveBeenCalledTimes(1);
    expect(sort.getSnapshot()).toEqual({ columnId: 'next', direction: 'desc' });
    sort.configure([]);
    expect(sort.getSnapshot()).toEqual({});
    expect(next).not.toHaveBeenCalled();
    sort.configure([]);
    expect(reset).toHaveBeenCalledTimes(1);
  });

  it('ignores unknown columns and emits only actual snapshot changes', () => {
    const sort = new ColumnSort();
    const listener = vi.fn();
    const release = sort.subscribe(listener);
    sort.configure([{ id: 'name', config: { onToggle: vi.fn() } }]);
    sort.toggle('missing');
    expect(listener).not.toHaveBeenCalled();
    sort.toggle('name');
    const snapshot = sort.getSnapshot();
    sort.configure([{ id: 'name', config: { onToggle: vi.fn() } }]);
    expect(sort.getSnapshot()).toBe(snapshot);
    expect(listener).toHaveBeenCalledTimes(1);
    release();
    sort.toggle('name');
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('isolates sort state between instances and commits the new state before consumer callbacks', () => {
    const first = new ColumnSort();
    const second = new ColumnSort();
    const onToggle = vi.fn(() => expect(first.getSnapshot()).toEqual({ columnId: 'name', direction: 'asc' }));
    first.configure([{ id: 'name', config: { onToggle } }]);
    second.configure([{ id: 'name', config: { onToggle: vi.fn() } }]);
    first.toggle('name');
    expect(second.getSnapshot()).toEqual({});
    expect(onToggle).toHaveBeenCalledTimes(1);
  });
});
