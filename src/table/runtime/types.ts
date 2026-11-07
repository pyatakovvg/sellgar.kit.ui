import type { GeometryColumn, Layout, LayoutAnchor } from '../core/layout/types';

export interface TableRuntimeOptions {
  readonly rowHeight: number;
  readonly minRowHeight: number;
  readonly overscan: number;
  readonly virtual: boolean;
  readonly sticky: boolean;
  readonly expansion?: boolean;
}

export interface TableViewport {
  readonly container: number;
  readonly width: number;
  readonly height: number;
  readonly scroll: number;
  readonly left: number;
  readonly top: number;
  readonly screenLeft: number;
  readonly scale: number;
}

export interface TableColumnGeometry {
  readonly id: string;
  readonly index: number;
  readonly width: number;
  readonly left: boolean;
  readonly right: boolean;
  readonly resizable: boolean;
}

export interface TableRowGeometry {
  readonly id: string;
  readonly index: number;
  readonly top: number;
  readonly height: number;
  readonly contentHeight: number;
  readonly expanded: boolean;
}

export interface TableSnapshot {
  readonly columns: readonly TableColumnGeometry[];
  readonly rows: readonly TableRowGeometry[];
  readonly widths: readonly number[];
  readonly rowCount: number;
  readonly columnCount: number;
  readonly total: number;
  readonly minimumWidth: number;
  readonly bodyHeight: number;
  readonly headerHeight: number;
  readonly headerTop: number;
  readonly viewport: TableViewport;
  readonly version: number;
  readonly dragging: boolean;
  readonly error?: string;
}

export interface TableResizeOperation {
  readonly index: number;
  readonly columns: GeometryColumn[];
  readonly layout: Layout;
  readonly anchor?: LayoutAnchor;
  readonly container: number;
  readonly startX: number;
  readonly startWidth: number;
}

export interface TableCellMeasurement {
  readonly rowId: string;
  readonly columnId: string;
  readonly version: number;
  readonly height: number;
}

export interface TableExpandedMeasurement {
  readonly kind: 'expanded';
  readonly rowId: string;
  readonly version: number;
  readonly height: number;
}

export type TableMeasurement = TableCellMeasurement | TableExpandedMeasurement;
