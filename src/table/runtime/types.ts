import type { TreeNode } from '../core/tree/visible-tree-ids';
import type { ColumnRegion, HorizontalRegion } from '../core/geometry/types';
import type { PinColumn } from '../core/pinning';

export interface TableRuntimeOptions {
  readonly rowHeight: number;
  readonly minRowHeight: number;
  readonly overscan: number;
  readonly virtual: boolean;
  readonly sticky: boolean;
  readonly expansion?: boolean;
  readonly tree?: { readonly nodes: readonly TreeNode[]; readonly defaultExpanded?: boolean };
  readonly pinning?: { readonly reserve?: number };
}

export interface TableViewport {
  readonly container: number;
  readonly available?: number;
  readonly width: number;
  readonly height: number;
  readonly scroll: number;
  readonly left: number;
  readonly top: number;
  readonly screenLeft: number;
  readonly originLeft?: number;
  readonly originTop?: number;
  readonly scale: number;
  readonly scaleY?: number;
}

export interface TableColumnGeometry {
  readonly id: string;
  readonly index: number;
  readonly width: number;
  readonly left: boolean;
  readonly right: boolean;
  readonly resizable: boolean;
  readonly resizeEdge: 'left' | 'right';
  readonly sourceIndex: number;
  readonly region: ColumnRegion;
  readonly pinInset?: number;
  readonly offset: number;
  readonly displayOffset: number;
  readonly shift: number;
  readonly clipLeft: number;
  readonly clipRight: number;
  readonly resizeBounds?: { readonly min: number; readonly max: number };
}

export interface TableRowGeometry {
  readonly id: string;
  readonly index: number;
  readonly top: number;
  readonly height: number;
  readonly contentHeight: number;
  readonly expanded: boolean;
  readonly treeExpanded?: boolean;
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
  readonly headerFloating: boolean;
  readonly viewport: TableViewport;
  readonly version: number;
  readonly dragging: boolean;
  readonly error?: string;
  readonly pinning?: {
    readonly status: 'active' | 'suspended';
    readonly columns: readonly PinColumn[];
    readonly reserve: number;
  };
  readonly regions?: Readonly<Record<ColumnRegion, HorizontalRegion>>;
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

export interface TableEmptyMeasurement {
  readonly kind: 'empty';
  readonly version: number;
  readonly height: number;
}

export type TableMeasurement = TableCellMeasurement | TableExpandedMeasurement | TableEmptyMeasurement;
