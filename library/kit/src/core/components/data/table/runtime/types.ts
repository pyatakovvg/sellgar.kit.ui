export type TableNodeId = string;
export type TableColumnId = string;
export type TableLineId = string;
export type TableCellId = string;
export type TableRendererId = string;

export type TableTextAlign = 'left' | 'center' | 'right';
export type TableSortDirection = 'asc' | 'desc';
export type TableColumnPinSide = 'left' | 'right';

export type TableLineKind = 'data' | 'empty' | 'expanded';
export type TableColumnKind = 'data' | 'selection' | 'tree';
export type TableCellKind = 'data' | 'selection' | 'tree';

export type TableColumnWidth = number | string;
export type TableColumnWidths = ReadonlyMap<TableColumnId, number>;

export interface TableColumnActionRenderContext<TState = unknown> {
  state: TState;
}

export interface TableColumnActionModel<TState = unknown, TContent = unknown> {
  state: TState;
  disabled?: boolean;
  onAction(): void;
  render(context: TableColumnActionRenderContext<TState>): TContent;
}

export interface TableColumnModel<THeader = unknown, TActionContent = unknown> {
  columnId: TableColumnId;
  kind: TableColumnKind;
  header?: THeader;
  actions: readonly TableColumnActionModel<unknown, TActionContent>[];
  align?: TableTextAlign;
  sort?: TableColumnSortConfig;
  width?: TableColumnWidth;
  order?: number;
  visible?: boolean;
  pinLeft?: boolean;
  pinRight?: boolean;
}

export interface TableColumnSortConfig {
  directionDefault?: TableSortDirection;
  onToggle(direction?: TableSortDirection): void;
  onReset?(): void;
}

export interface TableSortSnapshot {
  activeColumnId?: TableColumnId;
  direction?: TableSortDirection;
}

export interface TableColumnSortSnapshot {
  isSortable: boolean;
  isActive: boolean;
  direction?: TableSortDirection;
}

export interface TableColumnPinSnapshot {
  side: TableColumnPinSide;
  offset: number;
  isBoundary: boolean;
}

export interface TableColumnLayoutSnapshot<THeader = unknown, TActionContent = unknown> {
  column: TableColumnModel<THeader, TActionContent>;
  columnId: TableColumnId;
  sourceIndex: number;
  visualIndex: number;
  gridTemplateTrack: string;
  pin?: TableColumnPinSnapshot;
  sort: TableColumnSortSnapshot;
}

export interface TableNodeModel<T> {
  nodeId: TableNodeId;
  data: T;
  index: number;
  depth: number;
  parentNodeId: TableNodeId | null;
  hasChildren: boolean;
}

export interface TableCellRenderContext<T> {
  row: T;
  node: TableNodeModel<T>;
  nodeId: TableNodeId;
  rowIndex: number;
  rowSelected: boolean;
  columnId: TableColumnId;
  columnIndex: number;
  cellId: TableCellId;
  lineId: TableLineId;
}

export interface TableCellRenderDescriptor<T> {
  rendererId: TableRendererId;
  context: TableCellRenderContext<T>;
}

export interface TableCellSnapshot<T> {
  id: TableCellId;
  nodeId: TableNodeId;
  columnId: TableColumnId;
  lineId: TableLineId;
  columnIndex: number;
  kind: TableCellKind;
  render: TableCellRenderDescriptor<T>;
}

export interface TableDataLineSnapshot<T> {
  id: TableLineId;
  kind: 'data';
  visualIndex: number;
  node: TableNodeModel<T>;
  selected: boolean;
  selectionIndeterminate: boolean;
}

export interface TableEmptyLineSnapshot {
  id: TableLineId;
  kind: 'empty';
  visualIndex: number;
  columnSpan: number;
}

export interface TableExpandedRenderContext<T> {
  row: T;
  node: TableNodeModel<T>;
  nodeId: TableNodeId;
  rowIndex: number;
  lineId: TableLineId;
}

export interface TableExpandedLineSnapshot<T> {
  id: TableLineId;
  kind: 'expanded';
  visualIndex: number;
  node: TableNodeModel<T>;
  columnSpan: number;
  render: TableExpandedRenderContext<T>;
}

export type TableLineSnapshot<T> = TableDataLineSnapshot<T> | TableEmptyLineSnapshot | TableExpandedLineSnapshot<T>;

export interface TableSelectionSnapshot {
  allSelected: boolean;
  indeterminate: boolean;
  selectedNodeIds: TableNodeId[];
}

export interface TableSnapshot<T, THeader = unknown, TActionContent = unknown> {
  nodeIds: TableNodeId[];
  columns: TableColumnModel<THeader, TActionContent>[];
  columnLayouts: TableColumnLayoutSnapshot<THeader, TActionContent>[];
  gridTemplateColumns: string;
  selection: TableSelectionSnapshot;
  lines: TableLineSnapshot<T>[];
}
