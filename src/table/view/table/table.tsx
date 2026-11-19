import React from 'react';

import { compileTableConfiguration } from '../../configurator/serializer/compile-configuration';
import { Column } from '../../configurator/column/column';
import { Head } from '../../configurator/head/head';
import { Cell } from '../../configurator/cell/cell';
import { Empty } from '../../configurator/empty/empty';
import { Expand } from '../../configurator/expand/expand';
import { createGeometryColumns } from '../../core/layout/create-columns';
import { TableBrowser } from '../../runtime/browser/table-browser';
import { ColumnSort } from '../../runtime/columns/column-sort';
import { SelectionRuntime } from '../../runtime/selection';
import { TABLE_SELECTION_COLUMN_ID } from '../../core/column';
import { RowIdentities } from '../../runtime/row-identities';
import { TableRuntime } from '../../runtime/table-runtime';
import { ExpandedTableContext, TableContext } from './context/table-context';
import { CellContext } from './context/cell-context';
import { ExpandTrigger } from './surface/body/row/line/cell/expand-trigger';
import { Surface } from './surface';
import { TableControllerProvider, SelectionControllerContext } from './controller';
import { SelectionCheckbox } from './selection-checkbox';
import { isInteractiveTarget } from './interaction/interactive-target';

import type { TableConfigurationInput } from '../../configurator/types';
import type { TableRuntimeOptions } from '../../runtime/types';
import type { TableEnvironment } from './context/table-context';

interface IProps<T extends object> extends TableConfigurationInput<T> {}

const ROW_ESTIMATE = { sm: 40, md: 54, lg: 64 };

const TableComponent = <T extends object>(props: IProps<T>) => {
  const parentBrowser = React.useContext(ExpandedTableContext);
  const controller = React.useContext(SelectionControllerContext);
  const [runtime] = React.useState(() => new TableRuntime());
  const [browser] = React.useState(() => new TableBrowser(runtime));
  const [sort] = React.useState(() => new ColumnSort());
  const [selection] = React.useState(() => new SelectionRuntime<T>());
  const onSelect = React.useRef(props.select?.onSelect);
  const sortSnapshot = React.useSyncExternalStore(sort.subscribe, sort.getSnapshot, sort.getSnapshot);
  const [identities] = React.useState(() => new RowIdentities());
  const headerId = React.useId();
  const previousRows = React.useRef(new Map<string, T>());
  const configuration = React.useMemo(() => compileTableConfiguration(props), [props]);
  const tree = configuration.tree;
  const records = identities.identify(configuration.data.nodes, tree?.isUse ? tree.accessor : undefined);
  const recordsById = new Map(records.map((record) => [record.id, record]));

  React.useLayoutEffect(() => {
    onSelect.current = configuration.select?.onSelect;
  });

  React.useLayoutEffect(() => {
    let previousRows = selection.getSnapshot().rows;
    return selection.subscribe(() => {
      const rows = selection.getSnapshot().rows;
      if (rows === previousRows) return;
      previousRows = rows;
      onSelect.current?.([...rows]);
    });
  }, [selection]);

  React.useLayoutEffect(() => {
    selection.configure(
      records.map((record) => record.node),
      configuration.select?.isUse === true,
      tree?.isUse === true,
    );
  }, [selection, records, configuration.select?.isUse, tree?.isUse]);

  React.useLayoutEffect(() => controller?.connect(selection), [controller, selection]);

  React.useLayoutEffect(() => {
    sort.configure(
      configuration.columns.flatMap((column) =>
        column.visible !== false && column.sort ? [{ id: column.columnId, config: column.sort }] : [],
      ),
    );
  }, [sort, configuration]);

  React.useLayoutEffect(() => {
    if (!configuration.lastRowTrigger) browser.clearLastRow();
  }, [browser, configuration.lastRowTrigger]);

  React.useLayoutEffect(() => {
    browser.setResizeHandler((columnId, width) => {
      configuration.columns.find((column) => column.columnId === columnId)?.onResize?.(width);
    });
    return () => browser.setResizeHandler(undefined);
  }, [browser, configuration]);

  React.useLayoutEffect(() => {
    const columns = createGeometryColumns(configuration.columns);
    const virtual = configuration.layout?.virtualization;
    const options: TableRuntimeOptions = {
      minRowHeight: ROW_ESTIMATE[configuration.size ?? 'md'],
      rowHeight:
        typeof virtual === 'object'
          ? (virtual.rowHeight ?? ROW_ESTIMATE[configuration.size ?? 'md'])
          : ROW_ESTIMATE[configuration.size ?? 'md'],
      overscan: typeof virtual === 'object' ? (virtual.overscan ?? 3) : 3,
      virtual: typeof virtual === 'object' ? virtual.enabled !== false : virtual !== false,
      sticky: configuration.layout?.stickyHeader !== false,
      expansion: Boolean(configuration.renderers.expanded),
      pinning: configuration.layout?.pinning,
      tree: configuration.tree?.isUse
        ? {
            nodes: records.map((record) => record.node),
            defaultExpanded: configuration.tree.defaultExpanded,
          }
        : undefined,
    };
    const changed = records
      .filter((record) => previousRows.current.get(record.id) !== record.data)
      .map((record) => record.id);
    previousRows.current = new Map(records.map((record) => [record.id, record.data]));
    const correction = runtime.configure(
      columns,
      records.map((record) => record.id),
      changed,
      options,
    );
    browser.correctScroll(correction);
  }, [configuration, records, runtime, browser]);

  const environment = React.useMemo<TableEnvironment>(
    () => ({
      runtime,
      selection,
      browser,
      parentBrowser: parentBrowser ?? undefined,
      headerId,
      loading: configuration.loading,
      scroll: configuration.layout?.scroll ?? 'external',
      stickyTop:
        typeof configuration.layout?.stickyHeader === 'object'
          ? (configuration.layout.stickyHeader.top ?? '0px')
          : '0px',
      className: configuration.className,
      size: configuration.size ?? 'md',
      tableStyle: configuration.style ?? 'primary',
      surface: configuration.surface ?? 'standalone',
      align: (columnId) => configuration.columns.find((column) => column.columnId === columnId)?.align,
      interactive: Boolean(configuration.row?.handlers),
      primaryAction: Boolean(configuration.row?.handlers?.click),
      delayClick: Boolean(configuration.row?.handlers?.click && configuration.row.handlers.doubleClick),
      expandable: Boolean(configuration.renderers.expanded),
      sort: sortSnapshot,
      sortable: (columnId) => Boolean(configuration.columns.find((column) => column.columnId === columnId)?.sort),
      toggleSort: (columnId) => sort.toggle(columnId),
      toggleTree: (rowId) => {
        if (runtime.isTreeExpanded(rowId)) selection.clearPartialSubtree(rowId);
        browser.toggleTree(rowId);
      },
      lastRowTrigger: configuration.lastRowTrigger,
      lastRowVisible: (rowId) => {
        const record = recordsById.get(rowId);
        if (record) configuration.lastRowTrigger?.onLastRowVisible(record.data);
      },
      renderHeader: (columnId) =>
        columnId === TABLE_SELECTION_COLUMN_ID ? (
          <SelectionCheckbox />
        ) : (
          configuration.renderers.columns.get(columnId)?.header
        ),
      headerActions: (columnId) => configuration.renderers.columns.get(columnId)?.actions ?? [],
      renderEmpty: () => configuration.renderers.empty?.() ?? 'Нет данных',
      renderExpanded: (rowId) => {
        const record = recordsById.get(rowId);
        if (!record) return null;
        return configuration.renderers.expanded?.({
          row: record.data,
          node: record.node,
          nodeId: rowId,
          rowIndex: record.index,
          lineId: rowId,
        });
      },
      renderCell: (row, column, ExpandTrigger, TreeTrigger) => {
        if (column.id === TABLE_SELECTION_COLUMN_ID) return <SelectionCheckbox rowId={row.id} />;
        const record = recordsById.get(row.id);
        if (!record) return null;
        const content = configuration.renderers.columns.get(column.id)?.cell({
          row: record.data,
          node: record.node,
          nodeId: row.id,
          rowIndex: record.index,
          rowSelected: selection.getRowStatus(row.id).selected,
          columnId: column.id,
          columnIndex: column.index,
          cellId: JSON.stringify([row.id, column.id]),
          lineId: row.id,
          ExpandTrigger,
          TreeTrigger,
        });
        return (
          <CellContext.Provider
            value={{
              id: row.id,
              data: record.data,
              deps: record.node.depth,
              expanded: row.expanded,
              onToggle: () => browser.toggleExpanded(row.id),
            }}
          >
            {content}
          </CellContext.Provider>
        );
      },
      rowEvent: (rowId, trigger, event) => {
        const record = recordsById.get(rowId);
        if (!record) return;
        const options = configuration.row;
        if (options?.isInteractiveTarget?.(event.target)) return;
        if (!options?.disableDefaultInteractiveGuard && isInteractiveTarget(event.target)) return;
        options?.handlers?.[trigger]?.({
          row: record.data,
          rowIndex: record.index,
          context: {
            expansion: configuration.renderers.expanded
              ? {
                  expanded: runtime.isExpanded(rowId),
                  toggle: () => browser.toggleExpanded(rowId),
                }
              : undefined,
          },
          trigger,
          nativeEvent: event,
        });
      },
    }),
    [runtime, browser, selection, sort, sortSnapshot, parentBrowser, headerId, configuration, recordsById],
  );

  return (
    <SelectionControllerContext.Provider value={null}>
      <TableContext.Provider value={environment}>
        <Surface />
      </TableContext.Provider>
    </SelectionControllerContext.Provider>
  );
};

export const Table = Object.assign(TableComponent, {
  Column,
  Head,
  Cell,
  Empty,
  Expand,
  ExpandTrigger,
  ControllerProvider: TableControllerProvider,
});
