import React from 'react';

import type { TableCellRenderContext, TableNodeId } from '../../runtime';

export interface TableCellData<T = unknown> {
  id: TableNodeId;
  data: T;
  deps: number;
}

interface TableCellDataContextValue<T = unknown> extends TableCellData<T> {
  expanded: boolean;
  onExpandedToggle(): void;
}

export const TableCellDataContext = React.createContext<TableCellDataContextValue<unknown> | null>(null);

export const createTableCellDataContextValue = <T>(
  context: TableCellRenderContext<T>,
  expanded: boolean,
  onExpandedToggle: () => void,
): TableCellDataContextValue<T> => ({
  id: context.nodeId,
  data: context.row,
  deps: context.node.depth,
  expanded,
  onExpandedToggle,
});

const getTableCellDataFallback = <T>(): TableCellData<T> => ({
  id: '',
  data: undefined as T,
  deps: 0,
});

export const useCellData = <T>(source?: string): TableCellData<T> => {
  const context = React.useContext(TableCellDataContext);

  if (!context) {
    const label = source ? ` (${source})` : '';
    console.warn(`Table cell data context is not available${label}. Ensure hook is used inside Table.Cell.`);

    return getTableCellDataFallback<T>();
  }

  return {
    id: context.id,
    data: context.data as T,
    deps: context.deps,
  };
};

export const useRowExpanded = () => {
  const context = React.useContext(TableCellDataContext);

  if (!context) {
    console.warn('Table row expand context is not available. Ensure hook is used inside Table.Cell.');

    return {
      expanded: false,
      onToggle: () => {},
    };
  }

  return {
    expanded: context.expanded,
    onToggle: context.onExpandedToggle,
  };
};
