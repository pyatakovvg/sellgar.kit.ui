import React from 'react';

import { ExpandTrigger } from './expand-trigger.tsx';

import type { TableCellRenderContext } from '../runtime/types.ts';

export interface TableCellRenderScope<T = unknown> extends TableCellRenderContext<T> {
  ExpandTrigger: typeof ExpandTrigger;
}

export interface TableCellProps<T = unknown> {
  render?(context: TableCellRenderScope<T>): React.ReactNode;
}

interface TableCellComponent {
  <T = unknown>(props: React.PropsWithChildren<TableCellProps<T>>): React.ReactNode;
  displayName: string;
}

export const Cell: TableCellComponent = (props) => props.children;
Cell.displayName = 'TableCell';
