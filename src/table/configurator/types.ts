import React from 'react';

import type { TableCellRenderContext, TableColumnDefinition, TableExpandedRenderContext } from '../core/column';
import type { TableProps } from './table-props';

export interface TableData<T extends object> {
  readonly nodes: readonly T[];
  readonly getRowId?: (row: T) => string;
}

export interface TableHeadProps {
  label?: React.ReactNode;
}

export interface TableExpandTriggerProps {
  children: React.ReactNode | ((state: { expanded: boolean }) => React.ReactNode);
}

export interface TableCellRenderScope<T> extends TableCellRenderContext<T> {
  ExpandTrigger: React.FC<TableExpandTriggerProps>;
  TreeTrigger: React.FC;
}

export interface TableCellProps<T> {
  children?: React.ReactNode;
  render?(context: TableCellRenderScope<T>): React.ReactNode;
}

export interface TableExpandProps<T> {
  children?: React.ReactNode;
  render?(context: TableExpandedRenderContext<T>): React.ReactNode;
}

export interface TableActionProps<TState> {
  state: TState;
  disabled?: boolean;
  onAction(): void;
  children(scope: { state: TState }): React.ReactNode;
}

export interface TableActionComponent {
  <TState>(props: TableActionProps<TState>): React.ReactNode;
}

export interface TableActionsScope {
  Action: TableActionComponent;
}

export interface TableActionsProps {
  children?: React.ReactNode | ((scope: TableActionsScope) => React.ReactNode);
}

export interface TableColumnScope<T> {
  Head: React.FC<TableHeadProps>;
  Cell: React.FC<TableCellProps<T>>;
  Actions: React.FC<TableActionsProps>;
}

export interface TableColumnProps<T> extends Omit<TableColumnDefinition, 'columnId' | 'sourceIndex'> {
  children?: React.ReactNode | ((scope: TableColumnScope<T>) => React.ReactNode);
}

export interface TableRootScope<T> {
  Column: React.FC<TableColumnProps<T>>;
  Empty: React.FC<React.PropsWithChildren>;
  Expand: React.FC<TableExpandProps<T>>;
}

export interface TableConfigurationInput<T extends object> extends TableProps<T> {
  children?: React.ReactNode | ((scope: TableRootScope<NoInfer<T>>) => React.ReactNode);
}

export interface TableActionRenderer {
  readonly id: string;
  readonly disabled: boolean;
  onAction(): void;
  render(): React.ReactNode;
}

export interface TableColumnRenderers<T> {
  readonly header: React.ReactNode;
  readonly actions: readonly TableActionRenderer[];
  cell(context: TableCellRenderScope<T>): React.ReactNode;
}

export interface TableRenderers<T> {
  readonly columns: ReadonlyMap<string, TableColumnRenderers<T>>;
  readonly empty?: () => React.ReactNode;
  readonly expanded?: (context: TableExpandedRenderContext<T>) => React.ReactNode;
}

export interface TableConfiguration<T extends object> extends TableProps<T> {
  readonly columns: readonly TableColumnDefinition[];
  readonly renderers: TableRenderers<T>;
}
