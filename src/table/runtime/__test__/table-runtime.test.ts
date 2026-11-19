import { describe, expect, it } from 'vitest';

import { TableRuntime } from '../table-runtime';
import { RowIdentities } from '../row-identities';
import { createGeometryColumns } from '../../core/layout/create-columns';

import type { GeometryColumn } from '../../core/layout/types';
import type { TableViewport } from '../types';

const COLUMNS: GeometryColumn[] = [
  { id: 'name', mode: 'auto', resizable: true, width: 0, floor: 200, max: 2000 },
  { id: 'price', mode: 'fixed', width: 400, floor: 60, max: 1400 },
];
const OPTIONS = { rowHeight: 40, minRowHeight: 32, overscan: 3, virtual: true, sticky: true };
const VIEWPORT: TableViewport = {
  container: 1000,
  width: 1000,
  height: 520,
  scroll: 0,
  left: 0,
  top: 0,
  screenLeft: 0,
  scale: 1,
};
const IDS = Array.from({ length: 10000 }, (_, index) => `product:${index}`);

const createRuntime = () => {
  const runtime = new TableRuntime();
  runtime.configure(COLUMNS, IDS, [], OPTIONS);
  runtime.updateViewport(VIEWPORT);
  return runtime;
};

describe('Table runtime instance lifecycle', () => {
  it('applies resize permissions after visibility and order are resolved', () => {
    const runtime = new TableRuntime();
    runtime.configure(
      createGeometryColumns([
        { columnId: 'last', sourceIndex: 0, resizable: true, order: 10 },
        { columnId: 'first', sourceIndex: 1, width: 200, resizable: true, order: 0 },
        { columnId: 'hidden', sourceIndex: 2, resizable: true, visible: false },
      ]),
      ['record'],
      [],
      OPTIONS,
    );
    runtime.updateViewport(VIEWPORT);
    expect(runtime.getSnapshot().columns.map((column) => [column.id, column.resizable])).toEqual([
      ['first', true],
      ['last', true],
    ]);
    expect(runtime.beginResize('last', 100)).toBe(true);
    runtime.cancelResize();
    expect(runtime.beginResize('hidden', 100)).toBe(false);
    expect(runtime.beginResize('first', 100)).toBe(true);
  });

  it('retains permission on the last mounted column when more columns exist beyond the virtual window', () => {
    const runtime = new TableRuntime();
    runtime.configure(
      ['a', 'b', 'c'].map((id) => ({ id, mode: 'auto', width: 0, floor: 0, max: Infinity, resizable: true })),
      ['record'],
      [],
      OPTIONS,
    );
    runtime.updateViewport({ ...VIEWPORT, container: 900, width: 100 });
    expect(runtime.getSnapshot().columns.map((column) => [column.id, column.resizable])).toEqual([
      ['a', true],
      ['b', true],
    ]);
    runtime.updateViewport({ ...VIEWPORT, container: 900, width: 100, left: 800 });
    expect(runtime.getSnapshot().columns.at(-1)).toMatchObject({ id: 'c', resizable: true });
  });

  it('cancels a drag when permission is revoked and retains committed widths when permissions change', () => {
    const runtime = createRuntime();
    const disabled = COLUMNS.map((column) => ({ ...column, resizable: false }));
    runtime.beginResize('name', 100);
    runtime.moveResize(200);
    runtime.configure(disabled, IDS, [], OPTIONS);
    expect(runtime.getSnapshot()).toMatchObject({ dragging: false, widths: [600, 400] });
    expect(runtime.beginResize('name', 100)).toBe(false);
    runtime.configure(COLUMNS, IDS, [], OPTIONS);
    runtime.beginResize('name', 100);
    runtime.moveResize(200);
    runtime.finishResize();
    runtime.configure(disabled, IDS, [], OPTIONS);
    expect(runtime.getSnapshot().widths).toEqual([700, 400]);
  });

  it('accepts fixed-only schemas through the internal compensator', () => {
    const runtime = new TableRuntime();
    runtime.configure(
      [
        { id: 'a', mode: 'fixed', width: 600, floor: 0, max: Infinity },
        { id: 'b', mode: 'fixed', width: 600, floor: 0, max: Infinity },
      ],
      ['record'],
      [],
      OPTIONS,
    );
    expect(runtime.getSnapshot().error).toBeUndefined();
  });
  it('disables resizing by default and for an explicit false value', () => {
    const runtime = new TableRuntime();
    runtime.configure(
      [
        { id: 'default', mode: 'auto', width: 0, floor: 0, max: Infinity },
        { id: 'disabled', mode: 'auto', width: 0, floor: 0, max: Infinity, resizable: false },
        { id: 'last', mode: 'auto', width: 0, floor: 0, max: Infinity },
      ],
      ['record'],
      [],
      OPTIONS,
    );
    runtime.updateViewport(VIEWPORT);
    expect(runtime.getSnapshot().columns.every((column) => !column.resizable && !column.left && !column.right)).toBe(
      true,
    );
    expect(runtime.beginResize('default', 100)).toBe(false);
    expect(runtime.beginResize('disabled', 100)).toBe(false);
    expect(runtime.getSnapshot().dragging).toBe(false);
  });

  it('allows explicitly enabled columns including the last column', () => {
    const runtime = new TableRuntime();
    runtime.configure(
      [
        { id: 'enabled', mode: 'auto', width: 0, floor: 0, max: Infinity, resizable: true },
        { id: 'last', mode: 'auto', width: 0, floor: 0, max: Infinity, resizable: true },
      ],
      ['record'],
      [],
      OPTIONS,
    );
    runtime.updateViewport(VIEWPORT);
    expect(runtime.getSnapshot().columns.map((column) => column.resizable)).toEqual([true, true]);
    expect(runtime.beginResize('last', 100)).toBe(true);
    runtime.cancelResize();
    expect(runtime.beginResize('enabled', 100)).toBe(true);
    runtime.moveResize(200);
    expect(runtime.getSnapshot().widths).toEqual([600, 500]);
  });
  it('isolates manual state and restores the initial layout on cancellation', () => {
    const first = createRuntime();
    const second = createRuntime();
    expect(first.beginResize('price', 100)).toBe(false);
    expect(first.beginResize('name', 100)).toBe(true);
    first.moveResize(200);
    expect(first.getSnapshot().widths).toEqual([700, 400]);
    expect(second.getSnapshot().widths).toEqual([600, 400]);
    first.cancelResize();
    expect(first.getSnapshot().widths).toEqual([600, 400]);
    expect(first.getSnapshot().dragging).toBe(false);
  });

  it('virtualizes ten thousand rows and preserves manual layout through scroll updates', () => {
    const runtime = createRuntime();
    runtime.beginResize('name', 100);
    runtime.moveResize(200);
    runtime.finishResize();
    runtime.updateViewport({ ...VIEWPORT, scroll: 4000 });
    expect(runtime.getSnapshot().rows.length).toBeLessThanOrEqual(
      Math.ceil((3 * VIEWPORT.height) / OPTIONS.rowHeight) + 2 * OPTIONS.overscan + 3,
    );
    expect(runtime.getSnapshot().rowCount).toBe(10000);
    expect(runtime.getSnapshot().widths).toEqual([700, 400]);
    expect(runtime.getSnapshot().headerTop).toBe(0);
  });

  it('preserves tall hidden cells and invalidates their cached heights on a width change', () => {
    const runtime = createRuntime();
    const version = runtime.getSnapshot().version;
    runtime.commitMeasurements([{ rowId: IDS[0], columnId: 'name', version, height: 600 }]);
    runtime.commitMeasurements([{ rowId: IDS[0], columnId: 'price', version, height: 40 }]);
    expect(runtime.getSnapshot().rows[0].height).toBe(600);
    runtime.updateViewport({ ...VIEWPORT, container: 1200, width: 1200 });
    const nextVersion = runtime.getSnapshot().version;
    runtime.commitMeasurements([{ rowId: IDS[0], columnId: 'name', version, height: 800 }]);
    expect(runtime.getSnapshot().rows[0].height).toBe(600);
    runtime.commitMeasurements([{ rowId: IDS[0], columnId: 'name', version: nextVersion, height: 80 }]);
    expect(runtime.getSnapshot().rows[0].height).toBe(80);
  });

  it('returns a single scroll correction for height changes above the visible anchor', () => {
    const runtime = createRuntime();
    runtime.updateViewport({ ...VIEWPORT, scroll: 1000 });
    const version = runtime.getSnapshot().version;
    const correction = runtime.commitMeasurements([
      { rowId: IDS[0], columnId: 'name', version, height: 60 },
      { rowId: IDS[1], columnId: 'name', version, height: 70 },
    ]);
    expect(correction).toBe(50);
    expect(runtime.getSnapshot().viewport.scroll).toBe(1050);
    expect(runtime.getSnapshot().rows.find((row) => row.id === IDS[25])?.top).toBe(1050);
  });

  it.each([{ width: 0 }, { height: 0 }, { width: 0, height: 0 }])(
    'updates measurements without moving an invisible viewport: %j',
    (hidden) => {
      const runtime = createRuntime();
      runtime.updateViewport({ ...VIEWPORT, scroll: 1000, ...hidden });
      const correction = runtime.commitMeasurements([
        { rowId: IDS[0], columnId: 'name', version: runtime.getSnapshot().version, height: 100 },
      ]);
      expect(correction).toBe(0);
      expect(runtime.getSnapshot().viewport.scroll).toBe(1000);
      runtime.updateViewport({ ...VIEWPORT, scroll: 0 });
      expect(runtime.getSnapshot().rows.find((row) => row.id === IDS[0])?.height).toBe(100);
    },
  );

  it('keeps measured geometry attached to row identities after reordering', () => {
    const runtime = createRuntime();
    runtime.commitMeasurements([
      { rowId: IDS[0], columnId: 'name', version: runtime.getSnapshot().version, height: 100 },
    ]);
    runtime.configure(COLUMNS, [IDS[1], IDS[0], ...IDS.slice(2)], [], OPTIONS);
    expect(runtime.getSnapshot().rows.find((row) => row.id === IDS[0])?.height).toBe(100);
    expect(runtime.getSnapshot().rows.find((row) => row.id === IDS[1])?.height).toBe(40);
  });

  it('releases listeners without affecting another table', () => {
    const first = createRuntime();
    const second = createRuntime();
    let updates = 0;
    const unsubscribe = first.subscribe(() => updates++);
    unsubscribe();
    first.updateViewport({ ...VIEWPORT, scroll: 4000 });
    expect(updates).toBe(0);
    expect(second.getSnapshot().viewport.scroll).toBe(0);
  });
});

describe('Table row identities', () => {
  it('reads replacement, insertion, reorder and deletion from the same array while retaining object IDs', () => {
    const registry = new RowIdentities();
    const first = { name: 'shirt' };
    const second = { name: 'trousers' };
    const rows = [first, second];
    const original = registry.identify(rows);
    const jacket = { name: 'jacket' };
    rows[1] = jacket;
    const replaced = registry.identify(rows);
    expect(replaced.map((row) => row.data)).toEqual([first, jacket]);
    expect(replaced[0].id).toBe(original[0].id);
    expect(replaced[1].id).not.toBe(original[1].id);
    rows.push(second);
    rows.reverse();
    expect(registry.identify(rows).map((row) => row.id)).toEqual([original[1].id, replaced[1].id, original[0].id]);
    rows.splice(1, 1);
    expect(registry.identify(rows).map((row) => row.id)).toEqual([original[1].id, original[0].id]);
  });

  it('retains measured rows, expansion and an active resize when the same objects are read again', () => {
    const registry = new RowIdentities();
    const first = { name: 'shirt' };
    const second = { name: 'trousers' };
    const rows = [first, second];
    const records = registry.identify(rows);
    const runtime = new TableRuntime();
    const options = { ...OPTIONS, expansion: true };
    runtime.configure(
      COLUMNS,
      records.map((row) => row.id),
      [],
      options,
    );
    runtime.updateViewport(VIEWPORT);
    runtime.toggleExpanded(records[0].id);
    expect(runtime.beginResize('name', 0)).toBe(true);
    runtime.moveResize(50);
    runtime.commitMeasurements([
      { rowId: records[0].id, columnId: 'name', height: 70, version: runtime.getSnapshot().version },
      { kind: 'expanded', rowId: records[0].id, height: 80, version: runtime.getSnapshot().version },
    ]);
    const widths = runtime.getSnapshot().widths;
    const before = runtime.getSnapshot().rows[0];
    const next = registry.identify(rows);
    runtime.configure(
      COLUMNS,
      next.map((row) => row.id),
      [],
      options,
    );
    expect(runtime.getSnapshot().dragging).toBe(true);
    expect(runtime.getSnapshot().widths).toEqual(widths);
    expect(runtime.getSnapshot().rows[0]).toMatchObject({
      id: before.id,
      expanded: true,
      contentHeight: 70,
      height: 150,
    });
    runtime.finishResize();
    rows[1] = { name: 'jacket' };
    const replaced = registry.identify(rows);
    runtime.configure(
      COLUMNS,
      replaced.map((row) => row.id),
      [replaced[1].id],
      options,
    );
    expect(runtime.getSnapshot().rows[0]).toMatchObject({
      id: before.id,
      expanded: true,
      contentHeight: 70,
      height: 150,
    });
    expect(runtime.getSnapshot().rows[1]).toMatchObject({ id: replaced[1].id, expanded: false, height: 40 });
  });

  it('refreshes changed tree children while preserving existing branch identity and disclosure', () => {
    interface Row {
      name: string;
      children: Row[];
    }
    const branch: Row = { name: 'branch', children: [{ name: 'child', children: [] }] };
    const rows = [branch];
    const registry = new RowIdentities();
    const runtime = new TableRuntime();
    const configure = () => {
      const records = registry.identify(rows, (row) => row.children);
      runtime.configure(
        COLUMNS,
        records.map((row) => row.id),
        [],
        { ...OPTIONS, tree: { nodes: records.map((row) => row.node), defaultExpanded: true } },
      );
      return records;
    };
    const before = configure();
    runtime.updateViewport(VIEWPORT);
    runtime.toggleTree(before[0].id);
    branch.children.push({ name: 'new child', children: [] });
    const after = configure();
    expect(after.map((row) => row.data.name)).toEqual(['branch', 'child', 'new child']);
    expect(after[0].id).toBe(before[0].id);
    expect(after[1].id).toBe(before[1].id);
    expect(runtime.getSnapshot().rows.map((row) => row.id)).toEqual([before[0].id]);
    runtime.toggleTree(before[0].id);
    expect(runtime.getSnapshot().rows.map((row) => row.id)).toEqual(after.map((row) => row.id));
  });

  it('preserves object identity across reorders independently of business identifiers', () => {
    const registry = new RowIdentities();
    const first = { uuid: 'a' };
    const second = { uuid: 'b' };
    const before = registry.identify([first, second]);
    expect(registry.identify([second, first]).map((row) => row.id)).toEqual([before[1].id, before[0].id]);
    first.uuid = 'changed';
    expect(registry.identify([first])[0].id).toBe(before[0].id);
    const duplicates = registry.identify([{ uuid: 'changed' }, { uuid: 'changed' }]);
    expect(duplicates[0].id).not.toBe(before[0].id);
    expect(duplicates[0].id).not.toBe(duplicates[1].id);
    expect(() => registry.identify([first, first])).toThrow(/unique/);
  });
});

describe('Table expanded row geometry', () => {
  const expandedRuntime = () => {
    const runtime = new TableRuntime();
    runtime.configure(COLUMNS, IDS, [], { ...OPTIONS, expansion: true });
    runtime.updateViewport(VIEWPORT);
    return runtime;
  };
  const measureExpanded = (runtime: TableRuntime, id: string, height: number) =>
    runtime.commitMeasurements([{ kind: 'expanded', rowId: id, height, version: runtime.getSnapshot().version }]);

  it('adds expanded content to the virtual axis without stretching the data line', () => {
    const runtime = expandedRuntime();
    runtime.toggleExpanded(IDS[0]);
    measureExpanded(runtime, IDS[0], 200);
    expect(runtime.getSnapshot().rows[0]).toMatchObject({ expanded: true, height: 240, contentHeight: 40 });
    expect(runtime.getSnapshot().rows[1].top).toBe(240);
    expect(runtime.getSnapshot().bodyHeight).toBe(400200);
    expect(runtime.getSnapshot().rows.length).toBeLessThanOrEqual(
      Math.ceil((3 * VIEWPORT.height) / OPTIONS.rowHeight) + 2 * OPTIONS.overscan + 3,
    );
  });

  it('remeasures nested height in both directions and collapses without leaving space', () => {
    const runtime = expandedRuntime();
    runtime.toggleExpanded(IDS[0]);
    measureExpanded(runtime, IDS[0], 200);
    runtime.commitMeasurements([
      { rowId: IDS[0], columnId: 'name', height: 80, version: runtime.getSnapshot().version },
    ]);
    measureExpanded(runtime, IDS[0], 60);
    expect(runtime.getSnapshot().rows[0]).toMatchObject({ height: 140, contentHeight: 80 });
    runtime.toggleExpanded(IDS[0]);
    measureExpanded(runtime, IDS[0], 999);
    expect(runtime.getSnapshot().rows[0]).toMatchObject({ expanded: false, height: 80, contentHeight: 80 });
    expect(runtime.getSnapshot().rows[1].top).toBe(80);
    runtime.toggleExpanded(IDS[0]);
    expect(runtime.getSnapshot().rows[0].height).toBe(140);
  });

  it('corrects scrolling when an expanded row above the visible anchor changes', () => {
    const runtime = expandedRuntime();
    runtime.updateViewport({ ...VIEWPORT, scroll: 1000 });
    runtime.toggleExpanded(IDS[0]);
    expect(measureExpanded(runtime, IDS[0], 200)).toBe(200);
    expect(runtime.getSnapshot().viewport.scroll).toBe(1200);
    expect(runtime.toggleExpanded(IDS[0])).toBe(-200);
    expect(runtime.getSnapshot().viewport.scroll).toBe(1000);
  });

  it('retains expansion by identity after reordering and removes it when the record disappears', () => {
    const runtime = expandedRuntime();
    runtime.toggleExpanded(IDS[0]);
    measureExpanded(runtime, IDS[0], 200);
    runtime.configure(COLUMNS, [IDS[1], IDS[0]], [], { ...OPTIONS, expansion: true });
    expect(runtime.getSnapshot().rows[1]).toMatchObject({ id: IDS[0], expanded: true, height: 240 });
    runtime.configure(COLUMNS, [IDS[1]], [], { ...OPTIONS, expansion: true });
    runtime.configure(COLUMNS, [IDS[1], IDS[0]], [], { ...OPTIONS, expansion: true });
    expect(runtime.getSnapshot().rows[1]).toMatchObject({ expanded: false, height: 40 });
  });

  it('isolates expansion state between instances and ignores expansion when disabled', () => {
    const first = expandedRuntime();
    const second = expandedRuntime();
    first.toggleExpanded(IDS[0]);
    expect(second.isExpanded(IDS[0])).toBe(false);
    const plain = createRuntime();
    expect(plain.toggleExpanded(IDS[0])).toBe(0);
    expect(plain.isExpanded(IDS[0])).toBe(false);
  });

  it('keeps expanded owners mounted outside the virtual window so nested table state survives scrolling', () => {
    const runtime = expandedRuntime();
    runtime.toggleExpanded(IDS[0]);
    measureExpanded(runtime, IDS[0], 200);
    runtime.updateViewport({ ...VIEWPORT, scroll: 4000 });
    expect(runtime.getSnapshot().rows.some((row) => row.id === IDS[0] && row.expanded)).toBe(true);
    expect(runtime.getSnapshot().rows.length).toBeLessThanOrEqual(
      Math.ceil((3 * VIEWPORT.height) / OPTIONS.rowHeight) + 2 * OPTIONS.overscan + 3,
    );
    runtime.toggleExpanded(IDS[0]);
    expect(runtime.getSnapshot().rows.some((row) => row.id === IDS[0])).toBe(false);
  });

  it('ignores measurements from a previous expansion lifecycle', () => {
    const runtime = expandedRuntime();
    runtime.toggleExpanded(IDS[0]);
    const version = runtime.getSnapshot().version;
    runtime.toggleExpanded(IDS[0]);
    runtime.toggleExpanded(IDS[0]);
    runtime.commitMeasurements([{ kind: 'expanded', rowId: IDS[0], height: 999, version }]);
    expect(runtime.getSnapshot().rows[0].height).toBe(40);
  });
});

describe('Shared horizontal extent of expanded tables', () => {
  it('fits every level to the widest expanded requirement and releases it on collapse', () => {
    const runtime = createRuntime();
    runtime.updateViewport({ ...VIEWPORT, container: 478, width: 478 });
    runtime.setNestedWidth('variant:a', 734);
    expect(runtime.getSnapshot()).toMatchObject({ total: 734, minimumWidth: 734 });
    expect(runtime.getSnapshot().widths).toEqual([334, 400]);
    expect(runtime.getSnapshot().viewport.width).toBe(478);
    runtime.setNestedWidth('variant:b', 900);
    expect(runtime.getSnapshot().total).toBe(900);
    runtime.setNestedWidth('variant:b', undefined);
    expect(runtime.getSnapshot().total).toBe(734);
    runtime.setNestedWidth('variant:a', undefined);
    expect(runtime.getSnapshot()).toMatchObject({ total: 600, minimumWidth: 600 });
  });

  it('propagates the intrinsic requirement rather than the available parent width', () => {
    const runtime = createRuntime();
    expect(runtime.getSnapshot()).toMatchObject({ total: 1000, minimumWidth: 600 });
    runtime.setNestedWidth('child', 700);
    expect(runtime.getSnapshot()).toMatchObject({ total: 1000, minimumWidth: 700 });
    runtime.updateViewport({ ...VIEWPORT, container: 1200, width: 478, left: 500 });
    expect(runtime.getSnapshot()).toMatchObject({ total: 1200, minimumWidth: 700 });
  });
});

describe('Header flow and floating state', () => {
  it('floats only after the threshold and while the table intersects the viewport', () => {
    const runtime = createRuntime();
    runtime.updateViewport({ ...VIEWPORT, scroll: -50 });
    expect(runtime.getSnapshot()).toMatchObject({ headerFloating: false, headerTop: 50 });
    runtime.updateViewport({ ...VIEWPORT, scroll: 0 });
    expect(runtime.getSnapshot().headerFloating).toBe(false);
    runtime.updateViewport({ ...VIEWPORT, scroll: 1 });
    expect(runtime.getSnapshot()).toMatchObject({ headerFloating: true, headerTop: 0 });
    const end = runtime.getSnapshot().bodyHeight;
    runtime.updateViewport({ ...VIEWPORT, scroll: end + 10 });
    expect(runtime.getSnapshot()).toMatchObject({ headerFloating: true, headerTop: -10 });
    runtime.updateViewport({ ...VIEWPORT, scroll: end + runtime.getSnapshot().headerHeight });
    expect(runtime.getSnapshot().headerFloating).toBe(false);
    runtime.updateViewport({ ...VIEWPORT, scroll: -1 });
    expect(runtime.getSnapshot()).toMatchObject({ headerFloating: false, headerTop: 1 });
  });

  it('keeps resize state across the flow threshold and never floats a disabled header', () => {
    const runtime = createRuntime();
    runtime.updateViewport({ ...VIEWPORT, scroll: -10 });
    runtime.beginResize('name', 100);
    runtime.moveResize(150);
    const widths = runtime.getSnapshot().widths;
    runtime.updateViewport({ ...VIEWPORT, scroll: 10 });
    expect(runtime.getSnapshot()).toMatchObject({ headerFloating: true, dragging: true, widths });
    runtime.updateViewport({ ...VIEWPORT, scroll: -10 });
    expect(runtime.getSnapshot()).toMatchObject({ headerFloating: false, dragging: true, widths });
    runtime.moveResize(200);
    expect(runtime.getSnapshot().widths).toEqual([700, 400]);
    runtime.finishResize();
    runtime.configure(COLUMNS, IDS, [], { ...OPTIONS, sticky: false });
    runtime.updateViewport({ ...VIEWPORT, scroll: 100 });
    expect(runtime.getSnapshot()).toMatchObject({ headerFloating: false, headerTop: -100 });
  });
});

describe('Geometry error recovery', () => {
  it('fills a smaller capped schema with the compensator and returns to ordinary auto', () => {
    const runtime = createRuntime();
    const invalid: GeometryColumn[] = [{ id: 'only', mode: 'auto', width: 0, floor: 0, max: 50 }];
    expect(() => runtime.configure(invalid, IDS, [], OPTIONS)).not.toThrow();
    expect(runtime.getSnapshot()).toMatchObject({ error: undefined, widths: [50, 950], total: 1000 });
    expect(runtime.beginResize('only', 0)).toBe(false);
    runtime.configure(COLUMNS, IDS, [], OPTIONS);
    expect(runtime.getSnapshot()).toMatchObject({ error: undefined, widths: [600, 400] });
  });

  it('fills a larger nested requirement despite user maxWidth and releases it on child removal', () => {
    const runtime = new TableRuntime();
    runtime.configure(
      [
        { id: 'auto', mode: 'auto', width: 0, floor: 0, max: 400 },
        { id: 'fixed', mode: 'fixed', width: 160, floor: 0, max: Infinity },
      ],
      ['row'],
      [],
      OPTIONS,
    );
    runtime.updateViewport({ ...VIEWPORT, container: 500, width: 500 });
    runtime.setNestedWidth('child', 800);
    expect(runtime.getSnapshot()).toMatchObject({ error: undefined, total: 800, widths: [400, 160, 240] });
    runtime.updateViewport({ ...VIEWPORT, container: 500, width: 500, scroll: 10 });
    expect(runtime.getSnapshot()).toMatchObject({ error: undefined, total: 800, widths: [400, 160, 240] });
    runtime.setNestedWidth('child', undefined);
    expect(runtime.getSnapshot()).toMatchObject({ error: undefined, total: 500 });
  });
});

describe('Row identity scroll anchoring', () => {
  it('keeps the visible record and inner offset through insertion, reordering and deletion', () => {
    const runtime = createRuntime();
    runtime.updateViewport({ ...VIEWPORT, scroll: 410 });
    expect(runtime.configure(COLUMNS, ['new', ...IDS], ['new'], OPTIONS)).toBe(40);
    expect(runtime.getSnapshot().viewport.scroll).toBe(450);
    const reordered = ['new', ...IDS.slice(0, 5), ...IDS.slice(6), IDS[5]];
    expect(runtime.configure(COLUMNS, reordered, [], OPTIONS)).toBe(-40);
    expect(runtime.getSnapshot().viewport.scroll).toBe(410);
    expect(
      runtime.configure(
        COLUMNS,
        reordered.filter((id) => id !== IDS[10]),
        [],
        OPTIONS,
      ),
    ).toBe(0);
    const state = runtime.getSnapshot();
    expect(
      state.rows.find((row) => row.top <= state.viewport.scroll && row.top + row.height > state.viewport.scroll)?.id,
    ).toBe(IDS[11]);
  });

  it('does not scroll the owner when the table is below the viewport', () => {
    const runtime = createRuntime();
    runtime.updateViewport({ ...VIEWPORT, scroll: -200 });
    expect(runtime.configure(COLUMNS, ['new', ...IDS], ['new'], OPTIONS)).toBe(0);
    expect(runtime.getSnapshot().viewport.scroll).toBe(-200);
  });
});

describe('Nested manual width requirements', () => {
  it('propagates manual overflow with multiple auto columns without feeding assigned width back into the request', () => {
    const runtime = new TableRuntime();
    const columns: GeometryColumn[] = ['a', 'b'].map((id) => ({
      id,
      mode: 'auto',
      width: 0,
      floor: 0,
      max: Infinity,
      resizable: true,
    }));
    runtime.configure(columns, ['row'], [], OPTIONS);
    runtime.updateViewport({ ...VIEWPORT, container: 500, width: 500, available: 500 });
    runtime.beginResize('a', 0);
    runtime.moveResize(300);
    runtime.finishResize();
    expect(runtime.getSnapshot()).toMatchObject({ widths: [550, 250], total: 800, minimumWidth: 800 });
    runtime.updateViewport({ ...VIEWPORT, container: 800, width: 500, available: 500 });
    expect(runtime.getSnapshot()).toMatchObject({ widths: [550, 250], total: 800, minimumWidth: 800 });
    runtime.updateViewport({ ...VIEWPORT, container: 1000, width: 500, available: 500 });
    expect(runtime.getSnapshot()).toMatchObject({ total: 1000, minimumWidth: 800 });
    runtime.updateViewport({ ...VIEWPORT, container: 800, width: 500, available: 500 });
    expect(runtime.getSnapshot().widths).toEqual([550, 250]);
    runtime.beginResize('a', 0);
    runtime.moveResize(-300);
    runtime.finishResize();
    expect(runtime.getSnapshot().minimumWidth).toBe(0);
    runtime.updateViewport({ ...VIEWPORT, container: 500, width: 500, available: 500 });
    expect(runtime.getSnapshot()).toMatchObject({ widths: [250, 250], total: 500 });
  });
});

describe('Dynamic row metrics and empty content', () => {
  it('releases empty presentation constraints while retaining manual column widths and header measurements', () => {
    const runtime = createRuntime();
    runtime.setHeaderHeight(44);
    runtime.beginResize('name', 500);
    runtime.moveResize(600);
    runtime.finishResize();
    const widths = runtime.getSnapshot().widths;
    const minimumWidth = runtime.getSnapshot().minimumWidth;
    runtime.configure(COLUMNS, [], [], OPTIONS);
    runtime.updateViewport({ ...VIEWPORT, scroll: 10 });
    expect(runtime.getSnapshot()).toMatchObject({
      rowCount: 0,
      headerHeight: 0,
      headerFloating: false,
      minimumWidth: 0,
      widths,
    });
    runtime.configure(COLUMNS, ['restored'], [], OPTIONS);
    expect(runtime.getSnapshot()).toMatchObject({
      rowCount: 1,
      headerHeight: 44,
      headerFloating: true,
      minimumWidth,
      widths,
    });
  });

  it('updates existing and hidden estimates in both size directions while retaining measured tall content', () => {
    const runtime = createRuntime();
    runtime.commitMeasurements([
      { rowId: IDS[0], columnId: 'name', height: 120, version: runtime.getSnapshot().version },
    ]);
    const version = runtime.getSnapshot().version;
    runtime.configure(COLUMNS, IDS, [], { ...OPTIONS, rowHeight: 64, minRowHeight: 64 });
    expect(runtime.getSnapshot().version).toBeGreaterThan(version);
    expect(
      runtime
        .getSnapshot()
        .rows.slice(0, 3)
        .map((row) => row.height),
    ).toEqual([120, 64, 64]);
    runtime.updateViewport({ ...VIEWPORT, scroll: 4000 });
    expect(runtime.getSnapshot().rows.every((row) => row.height >= 64)).toBe(true);
    runtime.configure(COLUMNS, IDS, [], OPTIONS);
    runtime.updateViewport(VIEWPORT);
    expect(
      runtime
        .getSnapshot()
        .rows.slice(0, 3)
        .map((row) => row.height),
    ).toEqual([120, 40, 40]);
  });

  it('measures arbitrary Empty content, rejects stale measurements and releases its height for real rows', () => {
    const runtime = new TableRuntime();
    runtime.configure(COLUMNS, [], [], OPTIONS);
    runtime.updateViewport(VIEWPORT);
    const version = runtime.getSnapshot().version;
    runtime.commitMeasurements([{ kind: 'empty', height: 232, version }]);
    expect(runtime.getSnapshot().bodyHeight).toBe(232);
    runtime.commitMeasurements([{ kind: 'empty', height: 80, version }]);
    expect(runtime.getSnapshot().bodyHeight).toBe(80);
    runtime.configure(COLUMNS, ['row'], ['row'], OPTIONS);
    runtime.commitMeasurements([{ kind: 'empty', height: 999, version }]);
    expect(runtime.getSnapshot().bodyHeight).toBe(40);
    runtime.configure(COLUMNS, [], [], OPTIONS);
    expect(runtime.getSnapshot().bodyHeight).toBe(40);
  });
});
