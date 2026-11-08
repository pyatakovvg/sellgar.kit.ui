import { describe, expect, it } from 'vitest';

import { RowIdentities } from '../row-identities';
import { TableRuntime } from '../table-runtime';

import type { GeometryColumn } from '../../core/layout/types';

interface Item {
  id: string;
  children?: Item[];
}
const DATA: Item[] = [{ id: 'a', children: [{ id: 'b', children: [{ id: 'c' }] }, { id: 'd' }] }, { id: 'e' }];
const identify = (data = DATA) =>
  new RowIdentities().identify(
    data,
    (row) => row.id,
    (row) => row.children,
  );
const COLUMNS: GeometryColumn[] = [
  { id: 'name', mode: 'auto', width: 0, floor: 100, max: Infinity, resizable: true },
  { id: 'other', mode: 'auto', width: 0, floor: 100, max: Infinity },
];
const OPTIONS = { rowHeight: 40, minRowHeight: 40, overscan: 0, virtual: false, sticky: true };
const createRuntime = (defaultExpanded = false) => {
  const runtime = new TableRuntime();
  const records = identify();
  runtime.configure(
    COLUMNS,
    records.map((row) => row.id),
    [],
    {
      ...OPTIONS,
      tree: { nodes: records.map((row) => row.node), defaultExpanded },
    },
  );
  runtime.updateViewport({
    container: 500,
    width: 500,
    height: 400,
    scroll: 0,
    left: 0,
    top: 0,
    screenLeft: 0,
    scale: 1,
  });
  return runtime;
};
const ids = (runtime: TableRuntime) => runtime.getSnapshot().rows.map((row) => row.id);

describe('Table tree', () => {
  it('builds depth, parent identities and preorder across all branches', () => {
    expect(identify().map(({ node }) => [node.nodeId, node.depth, node.parentNodeId, node.hasChildren])).toEqual([
      ['a', 0, null, true],
      ['b', 1, 'a', true],
      ['c', 2, 'b', false],
      ['d', 1, 'a', false],
      ['e', 0, null, false],
    ]);
  });
  it('rejects cycles, duplicate descendant identities and invalid children', () => {
    const cyclic: Item = { id: 'a' };
    cyclic.children = [cyclic];
    expect(() => identify([cyclic])).toThrow(/unique/);
    expect(() => identify([{ id: 'a', children: [{ id: 'a' }] }])).toThrow(/unique/);
    expect(() =>
      new RowIdentities().identify(
        DATA,
        (row) => row.id,
        () => 'invalid',
      ),
    ).toThrow(/array/);
  });
  it('toggles only descendants, remembers nested disclosure and leaves leaf rows inert', () => {
    const runtime = createRuntime();
    expect(ids(runtime)).toEqual(['a', 'e']);
    runtime.toggleTree('a');
    expect(ids(runtime)).toEqual(['a', 'b', 'd', 'e']);
    runtime.toggleTree('b');
    expect(ids(runtime)).toEqual(['a', 'b', 'c', 'd', 'e']);
    runtime.toggleTree('a');
    expect(ids(runtime)).toEqual(['a', 'e']);
    runtime.toggleTree('a');
    expect(ids(runtime)).toEqual(['a', 'b', 'c', 'd', 'e']);
    runtime.toggleTree('c');
    expect(ids(runtime)).toEqual(['a', 'b', 'c', 'd', 'e']);
  });
  it('supports initially expanded branches and discards state for removed identities', () => {
    const runtime = createRuntime(true);
    expect(ids(runtime)).toEqual(['a', 'b', 'c', 'd', 'e']);
    runtime.toggleTree('b');
    expect(ids(runtime)).toEqual(['a', 'b', 'd', 'e']);
    runtime.configure(COLUMNS, ['e'], [], { ...OPTIONS, tree: { nodes: [identify()[4].node] } });
    const records = identify();
    runtime.configure(
      COLUMNS,
      records.map((row) => row.id),
      [],
      { ...OPTIONS, tree: { nodes: records.map((row) => row.node), defaultExpanded: true } },
    );
    expect(ids(runtime)).toEqual(['a', 'b', 'c', 'd', 'e']);
  });
  it('keeps measured descendant heights and committed column widths through disclosure', () => {
    const runtime = createRuntime();
    runtime.beginResize('name', 100);
    runtime.moveResize(150);
    runtime.finishResize();
    const widths = runtime.getSnapshot().widths;
    runtime.toggleTree('a');
    runtime.commitMeasurements([{ rowId: 'b', columnId: 'name', height: 96, version: runtime.getSnapshot().version }]);
    runtime.toggleTree('a');
    runtime.toggleTree('a');
    expect(runtime.getSnapshot().rows.find((row) => row.id === 'b')?.height).toBe(96);
    expect(runtime.getSnapshot().widths).toEqual(widths);
    expect(runtime.getSnapshot().rows.find((row) => row.id === 'e')?.top).toBe(176);
  });
  it('restores a collapsed ancestor when the scroll anchor was inside its removed descendants', () => {
    const runtime = createRuntime(true);
    runtime.updateViewport({ ...runtime.getSnapshot().viewport, scroll: 60 });
    expect(runtime.toggleTree('a')).toBe(-60);
    expect(runtime.getSnapshot().viewport.scroll).toBe(0);
    expect(ids(runtime)).toEqual(['a', 'e']);
  });
  it('virtualizes visible tree rows rather than all descendant records', () => {
    const records = identify([
      { id: 'root', children: Array.from({ length: 10000 }, (_, i) => ({ id: `item:${i}` })) },
    ]);
    const runtime = new TableRuntime();
    runtime.configure(
      COLUMNS,
      records.map((row) => row.id),
      [],
      { ...OPTIONS, virtual: true, tree: { nodes: records.map((row) => row.node) } },
    );
    runtime.updateViewport({
      container: 500,
      width: 500,
      height: 200,
      scroll: 0,
      left: 0,
      top: 0,
      screenLeft: 0,
      scale: 1,
    });
    expect(runtime.getSnapshot().rowCount).toBe(1);
    runtime.toggleTree('root');
    expect(runtime.getSnapshot().rowCount).toBe(10001);
    expect(runtime.getSnapshot().rows.length).toBeLessThan(10);
  });

  it('retains expanded details in hidden descendants and removes their height when expansion is disabled', () => {
    const runtime = createRuntime(true);
    const records = identify();
    const tree = { nodes: records.map((row) => row.node), defaultExpanded: true };
    runtime.configure(
      COLUMNS,
      records.map((row) => row.id),
      [],
      { ...OPTIONS, tree, expansion: true },
    );
    runtime.toggleExpanded('b');
    runtime.commitMeasurements([{ kind: 'expanded', rowId: 'b', height: 100, version: runtime.getSnapshot().version }]);
    runtime.toggleTree('a');
    expect(ids(runtime)).toEqual(['a', 'e']);
    runtime.toggleTree('a');
    expect(runtime.getSnapshot().rows.find((row) => row.id === 'b')).toMatchObject({ expanded: true, height: 140 });
    runtime.configure(
      COLUMNS,
      records.map((row) => row.id),
      [],
      { ...OPTIONS, tree, expansion: false },
    );
    expect(runtime.getSnapshot().rows.find((row) => row.id === 'b')).toMatchObject({ expanded: false, height: 40 });
  });
});
