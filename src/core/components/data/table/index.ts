export { Table } from './table.tsx';
export { useTableControllerSelection } from './adapter/controller';
export { useCellData, useRowExpanded } from './view/cell-data-context.ts';

export type {
  TableControllerSelection,
  TableControllerSelectionCommands,
  TableControllerSelectionSnapshot,
} from './adapter/controller';
export type { TableLastRowTriggerConfig } from './adapter/last-row-trigger.ts';
export type {
  TableRowConfig,
  TableRowEventPayload,
  TableRowEventTrigger,
  TableRowHandlers,
} from './adapter/row-events.ts';
export type {
  TableColumnActionProps,
  TableColumnActionRenderScope,
  TableColumnActionsChildren,
  TableColumnActionsProps,
  TableColumnActionsScope,
} from './configuration/actions.tsx';
export type { TableCellProps, TableCellRenderScope } from './configuration/cell.tsx';
export type { TableColumnChildren, TableColumnProps, TableColumnScope } from './configuration/column.tsx';
export type { TableEmptyProps } from './configuration/empty.tsx';
export type { TableExpandProps } from './configuration/expand.tsx';
export type { TableExpandTriggerProps, TableExpandTriggerRenderState } from './configuration/expand-trigger.tsx';
export type { TableHeadProps } from './configuration/head.tsx';
export type {
  TableChildren,
  TableComponentProps,
  TableData,
  TableLayoutConfig,
  TableLayoutScroll,
  TableProps,
  TableRootScope,
  TableSelectConfig,
  TableSize,
  TableStickyHeaderConfig,
  TableSurface,
  TableStyle,
  TableTreeConfig,
} from './table.tsx';
export type {
  TableColumnSortConfig,
  TableColumnWidth,
  TableColumnPinSide,
  TableSortDirection,
  TableTextAlign,
} from './runtime/types.ts';
