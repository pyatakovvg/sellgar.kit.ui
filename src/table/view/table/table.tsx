import React from 'react';

import { compileTableConfiguration } from '../../configurator/serializer/compile-configuration';
import { createGeometryColumns } from '../../core/layout/create-columns';
import { TableBrowser } from '../../runtime/browser/table-browser';
import { RowIdentities } from '../../runtime/row-identities';
import { TableRuntime } from '../../runtime/table-runtime';
import { ExpandedTableContext, TableContext } from './context/table-context';
import { Surface } from './surface';

import type { TableConfigurationInput } from '../../configurator/types';
import type { TableRuntimeOptions } from '../../runtime/types';
import type { TableEnvironment } from './context/table-context';

interface IProps<T extends object> extends TableConfigurationInput<T> {}

const ROW_ESTIMATE = { sm: 40, md: 54, lg: 64 };

export const Table = <T extends object>(props: IProps<T>) => {
  const parentBrowser = React.useContext(ExpandedTableContext);
  const [runtime] = React.useState(() => new TableRuntime());
  const [browser] = React.useState(() => new TableBrowser(runtime));
  const [identities] = React.useState(() => new RowIdentities());
  const headerId = React.useId();
  const previousRows = React.useRef(new Map<string, T>());
  const configuration = React.useMemo(() => compileTableConfiguration(props), [props]);
  const records = React.useMemo(
    () => identities.identify(configuration.data.nodes, configuration.data.getRowId),
    [configuration.data.nodes, configuration.data.getRowId, identities],
  );
  const recordsById = React.useMemo(() => new Map(records.map((record) => [record.id, record])), [records]);

  if (
    configuration.tree?.isUse ||
    configuration.select?.isUse ||
    configuration.lastRowTrigger ||
    configuration.columns.some((column) => column.pinLeft || column.pinRight || column.sort)
  ) {
    throw new Error(
      'This Table slice supports rows, expansion, geometry, resizing and virtualization; tree/selection/pinning/sort are not implemented.',
    );
  }

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
    };
    const changed = records
      .filter((record) => previousRows.current.get(record.id) !== record.data)
      .map((record) => record.id);
    previousRows.current = new Map(records.map((record) => [record.id, record.data]));
    runtime.configure(
      columns,
      records.map((record) => record.id),
      changed,
      options,
    );
  }, [configuration, records, runtime]);

  const environment = React.useMemo<TableEnvironment>(
    () => ({
      runtime,
      browser,
      parentBrowser: parentBrowser ?? undefined,
      headerId,
      scroll: configuration.layout?.scroll ?? 'internal',
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
      delayClick: Boolean(configuration.row?.handlers?.click && configuration.row.handlers.doubleClick),
      expandable: Boolean(configuration.renderers.expanded),
      renderHeader: (columnId) => configuration.renderers.columns.get(columnId)?.header,
      renderEmpty: () => configuration.renderers.empty?.() ?? 'Нет данных',
      renderExpanded: (rowId) => {
        const record = recordsById.get(rowId);
        if (!record) return null;
        return configuration.renderers.expanded?.({
          row: record.data,
          node: {
            nodeId: rowId,
            data: record.data,
            index: record.index,
            depth: 0,
            parentNodeId: null,
            hasChildren: false,
          },
          nodeId: rowId,
          rowIndex: record.index,
          lineId: rowId,
        });
      },
      renderCell: (row, column, ExpandTrigger) => {
        const record = recordsById.get(row.id);
        if (!record) return null;
        return configuration.renderers.columns.get(column.id)?.cell({
          row: record.data,
          node: {
            nodeId: row.id,
            data: record.data,
            index: record.index,
            depth: 0,
            parentNodeId: null,
            hasChildren: false,
          },
          nodeId: row.id,
          rowIndex: record.index,
          rowSelected: false,
          columnId: column.id,
          columnIndex: column.index,
          cellId: JSON.stringify([row.id, column.id]),
          lineId: row.id,
          ExpandTrigger,
        });
      },
      rowEvent: (rowId, trigger, event) => {
        const record = recordsById.get(rowId);
        if (!record) return;
        const options = configuration.row;
        if (options?.isInteractiveTarget?.(event.target)) return;
        if (
          !options?.disableDefaultInteractiveGuard &&
          event.target instanceof Element &&
          event.target.closest('a,button,input,select,textarea,[contenteditable="true"],[role="button"]')
        )
          return;
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
    [runtime, browser, parentBrowser, headerId, configuration, recordsById],
  );

  return (
    <TableContext.Provider value={environment}>
      <Surface />
    </TableContext.Provider>
  );
};
