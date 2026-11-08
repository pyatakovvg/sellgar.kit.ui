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
