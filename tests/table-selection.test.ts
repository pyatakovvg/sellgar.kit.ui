import assert from 'node:assert/strict';
import { test } from 'node:test';

import { SelectionRuntime } from '../src/table/runtime/selection.ts';
import { SelectionController } from '../src/table/runtime/selection-controller.ts';
import {
  clearPartialSelection,
  createEmptySelection,
  createSelectionIndex,
  getSelectionStatuses,
  isNodeSelected,
  retainSelection,
  toggleAllSelection,
  toggleSelection,
} from '../src/table/core/selection.ts';
import { SelectionRuntime as LegacySelection } from '../src/core/components/data/table/runtime/selection-runtime.ts';

import type { TableNodeModel } from '../src/table/core/column.ts';

interface Row {
  name: string;
}
const nodes = (names: string[]): TableNodeModel<Row>[] =>
  names.map((name, index) => ({
    nodeId: name,
    data: { name },
    depth: 0,
    parentNodeId: null,
    hasChildren: false,
    index,
  }));
const treeNodes = (): TableNodeModel<Row>[] => [
  { nodeId: 'root', data: { name: 'root' }, depth: 0, parentNodeId: null, hasChildren: true, index: 0 },
  { nodeId: 'branch', data: { name: 'branch' }, depth: 1, parentNodeId: 'root', hasChildren: true, index: 1 },
  { nodeId: 'a', data: { name: 'a' }, depth: 2, parentNodeId: 'branch', hasChildren: false, index: 2 },
  { nodeId: 'b', data: { name: 'b' }, depth: 2, parentNodeId: 'branch', hasChildren: false, index: 3 },
  { nodeId: 'c', data: { name: 'c' }, depth: 1, parentNodeId: 'root', hasChildren: false, index: 4 },
];
const selected = (runtime: SelectionRuntime<Row>) => runtime.getSnapshot().rows.map((row) => row.name);

test('instance starts inactive; enabling does not select records', () => {
  const runtime = new SelectionRuntime<Row>();
  assert.equal(runtime.getSnapshot().ready, false);
  runtime.configure(nodes(['a', 'b']), true, false);
  assert.equal(runtime.getSnapshot().ready, true);
  assert.equal(runtime.getSnapshot().enabled, true);
  assert.equal(runtime.getSnapshot().canSelectAll, true);
  assert.equal(runtime.getSnapshot().canClear, false);
  assert.deepEqual(selected(runtime), []);
});

test('single toggle and partial header state; clear is idempotent', () => {
  const runtime = new SelectionRuntime<Row>();
  runtime.configure(nodes(['a', 'b']), true, false);
  runtime.toggle('a');
  assert.deepEqual(selected(runtime), ['a']);
  assert.equal(runtime.getSnapshot().indeterminate, true);
  assert.equal(runtime.getRowStatus('a').selected, true);
  runtime.clear();
  const snapshot = runtime.getSnapshot();
  runtime.clear();
  runtime.toggle('unknown');
  assert.equal(runtime.getSnapshot(), snapshot);
  assert.deepEqual(selected(runtime), []);
});

test('select all includes subsequently appended records and preserves exceptions', () => {
  const runtime = new SelectionRuntime<Row>();
  const initial = nodes(['a', 'b']);
  runtime.configure(initial, true, false);
  runtime.selectAll();
  runtime.toggle('b');
  runtime.configure([...initial, ...nodes(['c'])], true, false);
  assert.deepEqual(selected(runtime), ['a', 'c']);
  assert.equal(runtime.getSnapshot().allSelected, false);
  runtime.toggleAll();
  assert.deepEqual(selected(runtime), ['a', 'b', 'c']);
  runtime.toggleAll();
  assert.deepEqual(selected(runtime), []);
});

test('individual selection does not include new rows', () => {
  const runtime = new SelectionRuntime<Row>();
  const initial = nodes(['a', 'b']);
  runtime.configure(initial, true, false);
  runtime.toggle('a');
  runtime.configure([...initial, ...nodes(['c'])], true, false);
  assert.deepEqual(selected(runtime), ['a']);
});

test('unchanged descriptors keep snapshot, row status, and subscriptions stable', () => {
  const runtime = new SelectionRuntime<Row>();
  const initial = nodes(['a', 'b']);
  runtime.configure(initial, true, false);
  const snapshot = runtime.getSnapshot();
  const rowStatus = runtime.getRowStatus('b');
  let calls = 0;
  runtime.subscribe(() => {
    calls++;
  });
  runtime.configure(
    initial.map((node) => ({ ...node })),
    true,
    false,
  );
  assert.equal(runtime.getSnapshot(), snapshot);
  assert.equal(calls, 0);
  runtime.toggle('a');
  assert.equal(runtime.getRowStatus('b'), rowStatus);
  assert.equal(calls, 1);
});

test('reordering preserves membership and follows current data order', () => {
  const runtime = new SelectionRuntime<Row>();
  const initial = nodes(['a', 'b', 'c']);
  runtime.configure(initial, true, false);
  runtime.selectAll();
  runtime.toggle('b');
  runtime.configure([...initial].reverse(), true, false);
  assert.deepEqual(selected(runtime), ['c', 'a']);
});

test('removed IDs are pruned, including exclusions; new objects use provided identities', () => {
  const runtime = new SelectionRuntime<Row>();
  const initial = nodes(['a', 'b']);
  runtime.configure(initial, true, false);
  runtime.toggle('a');
  runtime.configure([initial[1]], true, false);
  assert.deepEqual(selected(runtime), []);
  runtime.selectAll();
  runtime.toggle('b');
  runtime.configure([], true, false);
  runtime.configure(nodes(['b']), true, false);
  assert.deepEqual(selected(runtime), ['b']);
  const replacement = nodes(['b']);
  runtime.configure(replacement, true, false);
  assert.equal(runtime.getSnapshot().rows[0], replacement[0].data);
});

test('disabled and empty selection commands are inert, reenable starts empty', () => {
  const runtime = new SelectionRuntime<Row>();
  const initial = nodes(['a']);
  runtime.configure(initial, true, false);
  runtime.selectAll();
  runtime.configure(initial, false, false);
  const disabled = runtime.getSnapshot();
  runtime.selectAll();
  runtime.toggleAll();
  runtime.toggle('a');
  runtime.clear();
  assert.equal(runtime.getSnapshot(), disabled);
  assert.deepEqual(selected(runtime), []);
  runtime.configure(initial, true, false);
  assert.deepEqual(selected(runtime), []);
  runtime.configure([], true, false);
  const empty = runtime.getSnapshot();
  runtime.selectAll();
  runtime.toggleAll();
  assert.equal(runtime.getSnapshot(), empty);
});

test('table instances never share selection', () => {
  const left = new SelectionRuntime<Row>();
  const right = new SelectionRuntime<Row>();
  const initial = nodes(['a']);
  left.configure(initial, true, false);
  right.configure(initial, true, false);
  left.selectAll();
  assert.deepEqual(selected(left), ['a']);
  assert.deepEqual(selected(right), []);
});

test('tree selects descendants, normalizes ancestors, and returns parent data', () => {
  const runtime = new SelectionRuntime<Row>();
  runtime.configure(treeNodes(), true, true);
  runtime.toggle('a');
  assert.deepEqual(runtime.getRowStatus('branch'), { selected: false, indeterminate: true });
  assert.deepEqual(runtime.getRowStatus('root'), { selected: false, indeterminate: true });
  runtime.toggle('b');
  assert.deepEqual(selected(runtime), ['branch', 'a', 'b']);
  runtime.toggle('c');
  assert.deepEqual(selected(runtime), ['root', 'branch', 'a', 'b', 'c']);
  runtime.toggle('branch');
  assert.deepEqual(selected(runtime), ['c']);
  assert.deepEqual(runtime.getRowStatus('root'), { selected: false, indeterminate: true });
});

test('legacy collapse policy clears partial subtree and retains fully selected branch', () => {
  const runtime = new SelectionRuntime<Row>();
  runtime.configure(treeNodes(), true, true);
  runtime.toggle('a');
  runtime.toggle('c');
  runtime.clearPartialSubtree('branch');
  assert.deepEqual(selected(runtime), ['c']);
  runtime.toggle('branch');
  const before = runtime.getSnapshot();
  runtime.clearPartialSubtree('branch');
  assert.equal(runtime.getSnapshot(), before);
});

test('select-all mode also covers appended tree descendants', () => {
  const runtime = new SelectionRuntime<Row>();
  const initial = treeNodes();
  runtime.configure(initial, true, true);
  runtime.selectAll();
  runtime.configure([...initial, { ...nodes(['d'])[0], depth: 1, parentNodeId: 'root' }], true, true);
  assert.equal(runtime.getRowStatus('root').selected, true);
  assert.deepEqual(selected(runtime), ['root', 'branch', 'a', 'b', 'c', 'd']);
});

test('deep trees are iterative, including ancestor normalization', () => {
  const runtime = new SelectionRuntime<Row>();
  const initial = nodes(Array.from({ length: 10000 }, (_, index) => String(index))).map((node, index) => ({
    ...node,
    depth: index,
    parentNodeId: index ? String(index - 1) : null,
    hasChildren: index < 9999,
  }));
  runtime.configure(initial, true, true);
  runtime.toggle('9999');
  assert.equal(runtime.getSnapshot().selectedCount, 10000);
  assert.equal(runtime.getSnapshot().allSelected, true);
  runtime.toggle('5000');
  assert.equal(runtime.getSnapshot().selectedCount, 0);
});

test('controller directly forwards selection and detaches cleanly', () => {
  const controller = new SelectionController();
  const runtime = new SelectionRuntime<Row>();
  runtime.configure(nodes(['a', 'b']), true, false);
  let notifications = 0;
  const unsubscribe = controller.subscribe(() => {
    notifications++;
  });
  const disconnect = controller.connect(runtime);
  assert.equal(controller.getSnapshot(), runtime.getSnapshot());
  controller.selectAll();
  assert.deepEqual(selected(runtime), ['a', 'b']);
  assert.equal(controller.getSnapshot(), runtime.getSnapshot());
  controller.clear();
  controller.toggleAll();
  assert.equal(notifications, 4);
  disconnect();
  assert.equal(controller.getSnapshot().ready, false);
  controller.clear();
  assert.deepEqual(selected(runtime), ['a', 'b']);
  const count = notifications;
  runtime.clear();
  assert.equal(notifications, count);
  unsubscribe();
});

test('one controller rejects two active tables, but can reconnect after cleanup', () => {
  const controller = new SelectionController();
  const first = new SelectionRuntime();
  const second = new SelectionRuntime();
  const disconnect = controller.connect(first);
  assert.throws(() => controller.connect(second), /only one Table/);
  disconnect();
  const disconnectSecond = controller.connect(second);
  disconnect();
  assert.equal(controller.getSnapshot(), second.getSnapshot());
  disconnectSecond();
});

test('algorithms match legacy selection over 2000 mixed operations', () => {
  const legacy = new LegacySelection();
  const initial = treeNodes();
  const index = createSelectionIndex(initial);
  let modern = createEmptySelection();
  let old = createEmptySelection();
  let random = 82731;
  const next = () => {
    random = (random * 1664525 + 1013904223) >>> 0;
    return random;
  };
  for (let step = 0; step < 2000; step++) {
    const position = next() % initial.length;
    const node = initial[position];
    const action = next() % 5;
    const subtree = initial.slice(position, index.subtreeEnds[position]).map((entry) => entry.nodeId);
    const ancestors: string[][] = [];
    let parentId = node.parentNodeId;
    while (parentId !== null) {
      const parent = index.positions.get(parentId)!;
      ancestors.push(initial.slice(parent, index.subtreeEnds[parent]).map((entry) => entry.nodeId));
      parentId = initial[parent].parentNodeId;
    }
    if (action === 0) {
      modern = toggleAllSelection(modern, index);
      old = legacy.toggleAll(
        old,
        initial.map((entry) => entry.nodeId),
      );
    } else if (action === 1) {
      modern = toggleSelection(modern, index, node.nodeId, false);
      old = legacy.toggleNode(old, node.nodeId);
    } else if (action === 2) {
      modern = toggleSelection(modern, index, node.nodeId, true);
      old = legacy.toggleNodeSubtree(old, subtree, ancestors);
    } else if (action === 3) {
      modern = clearPartialSelection(modern, index, node.nodeId);
      if (legacy.getNodeStatuses(initial, old).get(node.nodeId)?.indeterminate) {
        old = legacy.clearNodeSubtree(old, subtree, ancestors);
      }
    } else {
      modern = retainSelection(modern, index);
      old = legacy.retain(
        old,
        initial.map((entry) => entry.nodeId),
      );
    }
    assert.equal(modern.type, old.type, `mode step ${step}`);
    for (const entry of initial) {
      assert.equal(isNodeSelected(modern, entry.nodeId), legacy.isNodeSelected(old, entry.nodeId), `step ${step}`);
    }
    assert.deepEqual(getSelectionStatuses(modern, index), legacy.getNodeStatuses(initial, old), `states step ${step}`);
  }
});
