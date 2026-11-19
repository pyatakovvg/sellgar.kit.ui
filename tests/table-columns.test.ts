import assert from 'node:assert/strict';
import { test } from 'node:test';
import React from 'react';

import { Column } from '../src/table/configurator/column/column.ts';
import { Head } from '../src/table/configurator/head/head.ts';
import { Cell } from '../src/table/configurator/cell/cell.ts';
import { compileTableConfiguration } from '../src/table/configurator/serializer/compile-configuration.ts';
import { createGeometryColumns } from '../src/table/core/layout/create-columns.ts';
import { TableRuntime } from '../src/table/runtime/table-runtime.ts';
import { ColumnSort } from '../src/table/runtime/columns/column-sort.ts';

import type { TableColumnProps, TableConfiguration } from '../src/table/configurator/types.ts';

const data = { nodes: [{}] };
const options = { rowHeight: 54, minRowHeight: 54, overscan: 3, virtual: true, sticky: true };
const column = (label: string, props: TableColumnProps<object> & { key?: React.Key } = {}) =>
  React.createElement(
    Column<object>,
    { width: 100, minWidth: 20, resizable: true, ...props },
    React.createElement(Head, { label }),
    React.createElement(Cell),
  );
const compile = (children: React.ReactNode) => compileTableConfiguration({ data, children });
const id = (configuration: TableConfiguration<object>, label: string) => {
  const entry = configuration.columns.find(
    (item) => configuration.renderers.columns.get(item.columnId)?.header === label,
  );
  assert.ok(entry);
  return entry.columnId;
};
const configure = (runtime: TableRuntime, configuration: TableConfiguration<object>) =>
  runtime.configure(createGeometryColumns(configuration.columns), ['row'], [], options);
const createRuntime = () => {
  const runtime = new TableRuntime();
  runtime.updateViewport({
    container: 1000,
    width: 1000,
    height: 200,
    scroll: 0,
    left: 0,
    top: 0,
    screenLeft: 0,
    scale: 1,
  });
  return runtime;
};
const resize = (runtime: TableRuntime, columnId: string, delta: number) => {
  assert.equal(runtime.beginResize(columnId, 0), true);
  runtime.moveResize(delta);
  runtime.finishResize();
};

test('conditional holes preserve identities without making keys mandatory', () => {
  const before = compile([column('A'), column('B'), column('C')]);
  for (const empty of [false, null, undefined]) {
    const after = compile([empty, column('B'), column('C')]);
    assert.equal(id(after, 'B'), id(before, 'B'));
    assert.equal(id(after, 'C'), id(before, 'C'));
    assert.equal(after.columns[0].sourceIndex, 0);
  }
});

test('nested fragments preserve conditional positions and keyed groups survive reordering', () => {
  const group = (show: boolean) => React.createElement(React.Fragment, null, show && column('A'), column('B'));
  assert.equal(id(compile(group(true)), 'B'), id(compile(group(false)), 'B'));
  const first = React.createElement(React.Fragment, { key: 'first' }, column('A'));
  const second = React.createElement(React.Fragment, { key: 'second' }, column('B'));
  assert.equal(id(compile([first, second]), 'B'), id(compile([second, first]), 'B'));
});

test('keyed array reordering preserves column identities', () => {
  const before = compile([column('A', { key: 'a' }), column('B', { key: 'b' })]);
  const after = compile([column('B', { key: 'b' }), column('A', { key: 'a' })]);
  assert.equal(id(after, 'A'), id(before, 'A'));
  assert.equal(id(after, 'B'), id(before, 'B'));
});

test('surviving columns retain manual width and sort while removed columns start fresh on return', () => {
  const events: string[] = [];
  const declarations = (show: boolean) =>
    compile([
      show && column('A', { sort: { onToggle: () => events.push('A'), onReset: () => events.push('reset A') } }),
      column('B', { sort: { onToggle: () => events.push('B'), onReset: () => events.push('reset B') } }),
      column('C', { width: undefined }),
    ]);
  const runtime = createRuntime();
  const sort = new ColumnSort();
  const install = (configuration: TableConfiguration<object>) => {
    configure(runtime, configuration);
    sort.configure(
      configuration.columns.flatMap((item) => (item.sort ? [{ id: item.columnId, config: item.sort }] : [])),
    );
  };
  const before = declarations(true);
  install(before);
  resize(runtime, id(before, 'A'), 60);
  resize(runtime, id(before, 'B'), 100);
  sort.toggle(id(before, 'B'));
  const hidden = declarations(false);
  install(hidden);
  assert.equal(runtime.getColumnWidth(id(hidden, 'B')), 200);
  assert.equal(runtime.getColumnWidth(id(before, 'A')), undefined);
  assert.equal(sort.getSnapshot().columnId, id(hidden, 'B'));
  assert.deepEqual(events, ['B']);
  const returned = declarations(true);
  install(returned);
  assert.equal(runtime.getColumnWidth(id(returned, 'A')), 100);
  assert.equal(runtime.getColumnWidth(id(returned, 'B')), 200);
  sort.toggle(id(returned, 'A'));
  install(hidden);
  assert.equal(sort.getSnapshot().columnId, undefined);
  install(returned);
  assert.equal(sort.getSnapshot().columnId, undefined);
  assert.deepEqual(events, ['B', 'reset B', 'A', 'reset A']);
});

test('measured minimum belongs to current columns and survives removal of a neighbor', () => {
  const before = compile([column('A'), column('B'), column('C', { width: undefined })]);
  const runtime = createRuntime();
  configure(runtime, before);
  runtime.commitContentWidths([{ columnId: id(before, 'B'), width: 180 }], runtime.getSnapshot().contentEpoch);
  const hiddenA = compile([false, column('B'), column('C', { width: undefined })]);
  configure(runtime, hiddenA);
  assert.equal(runtime.getColumnWidth(id(hiddenA, 'B')), 180);
  resize(runtime, id(hiddenA, 'B'), -1000);
  assert.equal(runtime.getColumnWidth(id(hiddenA, 'B')), 180);
  const hiddenB = compile([column('A'), false, column('C', { width: undefined })]);
  configure(runtime, hiddenB);
  configure(runtime, before);
  assert.equal(runtime.getColumnWidth(id(before, 'B')), 100);
});

test('removed pins discard their manual and reset widths without resetting surviving pins', () => {
  const declarations = (show: boolean) =>
    compile([
      show && column('A', { pinLeft: true }),
      column('B', { pinLeft: true }),
      column('C', { width: undefined }),
    ]);
  const runtime = createRuntime();
  const before = declarations(true);
  configure(runtime, before);
  for (const label of ['A', 'B']) {
    assert.equal(runtime.beginPinResize(id(before, label), 0, 'right'), true);
    runtime.moveResize(60);
    runtime.finishResize();
  }
  configure(runtime, declarations(false));
  assert.equal(runtime.getColumnWidth(id(before, 'B')), 160);
  configure(runtime, declarations(true));
  assert.equal(runtime.getColumnWidth(id(before, 'A')), 100);
  assert.equal(runtime.getColumnWidth(id(before, 'B')), 160);
  assert.equal(runtime.resetColumnWidth(id(before, 'A')), true);
  assert.equal(runtime.getColumnWidth(id(before, 'A')), 100);
  assert.equal(runtime.resetColumnWidth(id(before, 'B')), true);
  assert.equal(runtime.getColumnWidth(id(before, 'B')), 100);
});

test('neutral rerenders preserve manual width while changed declarations take effect', () => {
  const runtime = createRuntime();
  const before = compile([column('B'), column('C', { width: undefined })]);
  configure(runtime, before);
  resize(runtime, id(before, 'B'), 100);
  configure(runtime, compile([column('B'), column('C', { width: undefined })]));
  assert.equal(runtime.getColumnWidth(id(before, 'B')), 200);
  configure(runtime, compile([column('B', { width: 140 }), column('C', { width: undefined })]));
  assert.equal(runtime.getColumnWidth(id(before, 'B')), 140);
});

test('visible=false removes state and returning uses the declaration', () => {
  const declarations = (visible: boolean) =>
    compile([column('A'), column('B', { visible }), column('C', { width: undefined })]);
  const runtime = createRuntime();
  const before = declarations(true);
  configure(runtime, before);
  resize(runtime, id(before, 'B'), 100);
  configure(runtime, declarations(false));
  assert.equal(runtime.getColumnWidth(id(before, 'B')), undefined);
  configure(runtime, declarations(true));
  assert.equal(runtime.getColumnWidth(id(before, 'B')), 100);
});

test('removing a column during drag cancels that operation and retains committed neighbors', () => {
  const before = compile([column('A'), column('B'), column('C', { width: undefined })]);
  const runtime = createRuntime();
  configure(runtime, before);
  resize(runtime, id(before, 'B'), 100);
  assert.equal(runtime.beginResize(id(before, 'A'), 0), true);
  runtime.moveResize(50);
  const after = compile([false, column('B'), column('C', { width: undefined })]);
  configure(runtime, after);
  assert.equal(runtime.getSnapshot().dragging, false);
  assert.equal(runtime.getColumnWidth(id(after, 'B')), 200);
  assert.equal(runtime.getColumnWidth(id(before, 'A')), undefined);
});
