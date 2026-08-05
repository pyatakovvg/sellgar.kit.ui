import React from 'react';

import { Actions } from './actions.tsx';
import { Cell } from './cell.tsx';
import { Head } from './head.tsx';

import type { TableColumnActionsProps } from './actions.tsx';
import type { TableCellProps } from './cell.tsx';
import type { TableColumnSortConfig, TableColumnWidth, TableTextAlign } from '../runtime/types.ts';

export interface TableColumnScope<T = unknown> {
  Head: typeof Head;
  Actions(props: TableColumnActionsProps): React.ReactNode;
  Cell(props: React.PropsWithChildren<TableCellProps<T>>): React.ReactNode;
}

export type TableColumnChildren<T = unknown> = React.ReactNode | ((scope: TableColumnScope<T>) => React.ReactNode);

export interface TableColumnProps<T = unknown> {
  align?: TableTextAlign;
  sort?: TableColumnSortConfig;
  width?: TableColumnWidth;
  order?: number;
  visible?: boolean;
  pinLeft?: boolean;
  pinRight?: boolean;
  children?: TableColumnChildren<T>;
}

interface TableColumnComponent {
  <T = unknown>(props: TableColumnProps<T>): React.ReactNode;
  displayName: string;
}

export const createTableColumnScope = <T,>(): TableColumnScope<T> => ({
  Head,
  Actions,
  Cell: Cell as (props: React.PropsWithChildren<TableCellProps<T>>) => React.ReactNode,
});

export const Column: TableColumnComponent = () => null;
Column.displayName = 'TableColumn';
