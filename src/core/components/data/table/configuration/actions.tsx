import React from 'react';

export interface TableColumnActionRenderScope<TState = unknown> {
  state: TState;
}

export interface TableColumnActionProps<TState = unknown> {
  state: TState;
  disabled?: boolean;
  onAction(): void;
  children(scope: TableColumnActionRenderScope<TState>): React.ReactNode;
}

interface TableColumnActionComponent {
  <TState = unknown>(props: TableColumnActionProps<TState>): React.ReactNode;
  displayName: string;
}

export interface TableColumnActionsScope {
  Action: TableColumnActionComponent;
}

export type TableColumnActionsChildren = React.ReactNode | ((scope: TableColumnActionsScope) => React.ReactNode);

export interface TableColumnActionsProps {
  children?: TableColumnActionsChildren;
}

interface TableColumnActionsComponent {
  (props: TableColumnActionsProps): React.ReactNode;
  displayName: string;
}

export const Action: TableColumnActionComponent = () => null;
Action.displayName = 'TableColumnAction';

export const Actions: TableColumnActionsComponent = () => null;
Actions.displayName = 'TableColumnActions';

export const createTableColumnActionsScope = (): TableColumnActionsScope => ({
  Action,
});
