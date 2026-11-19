export const TABLE_SELECTION_COLUMN_ID = '__table.selection__';
export const TABLE_COMPENSATOR_COLUMN_ID = '__table.compensator__';

export type TableColumnId = string;
export type TableTextAlign = 'left' | 'center' | 'right';
export type TableSortDirection = 'asc' | 'desc';

/** Normalized logical numbers units or a legacy automatic width declaration. */
export type TableColumnWidth = number | string;

export interface TableColumnSortConfig {
  directionDefault?: TableSortDirection;
  onToggle(direction?: TableSortDirection): void;
  onReset?(): void;
}

export interface TableColumnDefinition {
  readonly columnId: TableColumnId;
  readonly sourceIndex: number;
  readonly width?: TableColumnWidth;
  readonly minWidth?: number;
  readonly maxWidth?: number;
  readonly align?: TableTextAlign;
  readonly order?: number;
  readonly visible?: boolean;
  readonly resizable?: boolean;
  /** Final logical width after a completed manual resize or reset. */
  readonly onResize?: (width: number) => void;
  readonly pinLeft?: boolean;
  readonly pinRight?: boolean;
  readonly sort?: TableColumnSortConfig;
}

export interface TableNodeModel<T> {
  readonly nodeId: string;
  readonly data: T;
  readonly index: number;
  readonly depth: number;
  readonly parentNodeId: string | null;
  readonly hasChildren: boolean;
}

export interface TableCellRenderContext<T> {
  readonly row: T;
  readonly node: TableNodeModel<T>;
  readonly nodeId: string;
  readonly rowIndex: number;
  readonly rowSelected: boolean;
  readonly columnId: TableColumnId;
  readonly columnIndex: number;
  readonly cellId: string;
  readonly lineId: string;
}

export interface TableExpandedRenderContext<T> {
  readonly row: T;
  readonly node: TableNodeModel<T>;
  readonly nodeId: string;
  readonly rowIndex: number;
  readonly lineId: string;
}
