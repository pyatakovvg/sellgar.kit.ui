import { describe, expect, it } from 'vitest';

import { RowIdentities } from '../row-identities';
import { TableRuntime } from '../table-runtime';

import type { GeometryColumn } from '../../core/layout/types';
import type { TableTreeConfig } from '../../configurator/table-props';

interface Item {
  id: string;
  children?: Item[];
}
const DATA: Item[] = [{ id: 'a', children: [{ id: 'b', children: [{ id: 'c' }] }, { id: 'd' }] }, { id: 'e' }];
const identities = new RowIdentities();
const identify = (data = DATA) => identities.identify(data, (row) => row.children);
const ROW_IDS = Object.fromEntries(identify().map(({ id, data }) => [data.id, id]));
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
      [ROW_IDS.a, 0, null, true],
      [ROW_IDS.b, 1, ROW_IDS.a, true],
      [ROW_IDS.c, 2, ROW_IDS.b, false],
      [ROW_IDS.d, 1, ROW_IDS.a, false],
      [ROW_IDS.e, 0, null, false],
    ]);
  });

  it('reads nested children through a typed accessor and filters every level without changing source data', () => {
    interface RecordNode {
      id: string;
      visible: boolean;
      branch?: { items: readonly RecordNode[] };
    }
    const leaf: RecordNode = { id: 'leaf', visible: true };
    const hidden: RecordNode = { id: 'hidden', visible: false };
    const branch: RecordNode = { id: 'branch', visible: true, branch: { items: [leaf, hidden] } };
    const root: RecordNode = { id: 'root', visible: true, branch: { items: [branch, hidden] } };
    const tree: TableTreeConfig<RecordNode> = {
      isUse: true,
      accessor: (row) => row.branch?.items.filter((child) => child.visible) ?? null,
    };
    const identities = new RowIdentities();
    const records = identities.identify([root], tree.accessor);

    expect(records.map(({ data, node }) => [data.id, node.depth, node.hasChildren])).toEqual([
      ['root', 0, true],
      ['branch', 1, true],
      ['leaf', 2, false],
    ]);
    expect(root.branch?.items).toEqual([branch, hidden]);
    expect(branch.branch?.items).toEqual([leaf, hidden]);
    expect(identities.identify([root], tree.accessor).map(({ id }) => id)).toEqual(records.map(({ id }) => id));
  });

  it('rejects cycles, duplicate descendant identities and invalid children', () => {
    const cyclic: Item = { id: 'a' };
    cyclic.children = [cyclic];
    expect(() => identify([cyclic])).toThrow(/unique/);
    const shared: Item = { id: 'shared' };
    expect(() => identify([{ id: 'root', children: [shared] }, shared])).toThrow(/unique/);
    expect(() => new RowIdentities().identify(DATA, () => 'invalid')).toThrow(/array/);
  });
  it('toggles only descendants, remembers nested disclosure and leaves leaf rows inert', () => {
    const runtime = createRuntime();
    expect(ids(runtime)).toEqual([ROW_IDS.a, ROW_IDS.e]);
    runtime.toggleTree(ROW_IDS.a);
    expect(ids(runtime)).toEqual([ROW_IDS.a, ROW_IDS.b, ROW_IDS.d, ROW_IDS.e]);
    runtime.toggleTree(ROW_IDS.b);
    expect(ids(runtime)).toEqual([ROW_IDS.a, ROW_IDS.b, ROW_IDS.c, ROW_IDS.d, ROW_IDS.e]);
    runtime.toggleTree(ROW_IDS.a);
    expect(ids(runtime)).toEqual([ROW_IDS.a, ROW_IDS.e]);
    runtime.toggleTree(ROW_IDS.a);
    expect(ids(runtime)).toEqual([ROW_IDS.a, ROW_IDS.b, ROW_IDS.c, ROW_IDS.d, ROW_IDS.e]);
    runtime.toggleTree(ROW_IDS.c);
    expect(ids(runtime)).toEqual([ROW_IDS.a, ROW_IDS.b, ROW_IDS.c, ROW_IDS.d, ROW_IDS.e]);
  });
  it('supports initially expanded branches and discards state for removed identities', () => {
    const runtime = createRuntime(true);
    expect(ids(runtime)).toEqual([ROW_IDS.a, ROW_IDS.b, ROW_IDS.c, ROW_IDS.d, ROW_IDS.e]);
    runtime.toggleTree(ROW_IDS.b);
    expect(ids(runtime)).toEqual([ROW_IDS.a, ROW_IDS.b, ROW_IDS.d, ROW_IDS.e]);
    runtime.configure(COLUMNS, [ROW_IDS.e], [], { ...OPTIONS, tree: { nodes: [identify()[4].node] } });
    const records = identify();
    runtime.configure(
      COLUMNS,
      records.map((row) => row.id),
      [],
      { ...OPTIONS, tree: { nodes: records.map((row) => row.node), defaultExpanded: true } },
    );
    expect(ids(runtime)).toEqual([ROW_IDS.a, ROW_IDS.b, ROW_IDS.c, ROW_IDS.d, ROW_IDS.e]);
  });
  it('keeps measured descendant heights and committed column widths through disclosure', () => {
    const runtime = createRuntime();
    runtime.beginResize('name', 100);
    runtime.moveResize(150);
    runtime.finishResize();
    const widths = runtime.getSnapshot().widths;
    runtime.toggleTree(ROW_IDS.a);
    runtime.commitMeasurements([
      { rowId: ROW_IDS.b, columnId: 'name', height: 96, version: runtime.getSnapshot().version },
    ]);
    runtime.toggleTree(ROW_IDS.a);
    runtime.toggleTree(ROW_IDS.a);
    expect(runtime.getSnapshot().rows.find((row) => row.id === ROW_IDS.b)?.height).toBe(96);
    expect(runtime.getSnapshot().widths).toEqual(widths);
    expect(runtime.getSnapshot().rows.find((row) => row.id === ROW_IDS.e)?.top).toBe(176);
  });
  it('restores a collapsed ancestor when the scroll anchor was inside its removed descendants', () => {
    const runtime = createRuntime(true);
    runtime.updateViewport({ ...runtime.getSnapshot().viewport, scroll: 60 });
    expect(runtime.toggleTree(ROW_IDS.a)).toBe(-60);
    expect(runtime.getSnapshot().viewport.scroll).toBe(0);
    expect(ids(runtime)).toEqual([ROW_IDS.a, ROW_IDS.e]);
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
    runtime.toggleTree(records[0].id);
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
    runtime.toggleExpanded(ROW_IDS.b);
    runtime.commitMeasurements([
      { kind: 'expanded', rowId: ROW_IDS.b, height: 100, version: runtime.getSnapshot().version },
    ]);
    runtime.toggleTree(ROW_IDS.a);
    expect(ids(runtime)).toEqual([ROW_IDS.a, ROW_IDS.e]);
    runtime.toggleTree(ROW_IDS.a);
    expect(runtime.getSnapshot().rows.find((row) => row.id === ROW_IDS.b)).toMatchObject({
      expanded: true,
      height: 140,
    });
    runtime.configure(
      COLUMNS,
      records.map((row) => row.id),
      [],
      { ...OPTIONS, tree, expansion: false },
    );
    expect(runtime.getSnapshot().rows.find((row) => row.id === ROW_IDS.b)).toMatchObject({
      expanded: false,
      height: 40,
    });
  });
});
