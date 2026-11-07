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
      ['last', false],
    ]);
    expect(runtime.beginResize('last', 100)).toBe(false);
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
    expect(runtime.getSnapshot().columns.at(-1)).toMatchObject({ id: 'c', resizable: false });
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

  it('reports an invalid schema without automatic columns', () => {
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
    expect(runtime.getSnapshot().error).toMatch(/automatic/);
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

  it('allows only explicitly enabled internal columns and ignores true on the last column', () => {
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
    expect(runtime.getSnapshot().columns.map((column) => column.resizable)).toEqual([true, false]);
    expect(runtime.beginResize('last', 100)).toBe(false);
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
    expect(runtime.getSnapshot().rows.length).toBeLessThan(30);
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
  it('preserves object identity across reorders and accepts stable ids across refreshes', () => {
    const registry = new RowIdentities();
    const first = { uuid: 'a' };
    const second = { uuid: 'b' };
    const before = registry.identify([first, second]);
    expect(registry.identify([second, first]).map((row) => row.id)).toEqual([before[1].id, before[0].id]);
    expect(registry.identify([{ uuid: 'a' }], (row) => row.uuid)[0].id).toBe('a');
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
    expect(runtime.getSnapshot().rows.length).toBeLessThan(30);
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
    expect(runtime.getSnapshot().rows.length).toBeLessThan(30);
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
