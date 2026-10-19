import React from 'react';

import { TableCellView } from '../cell';
import { TableEmptyLineView } from '../empty-line';
import { TableExpandedLineView } from '../expanded-line';

import s from './default.module.scss';

import type {
  TableCellSnapshot,
  TableColumnLayoutSnapshot,
  TableColumnModel,
  TableDataLineSnapshot,
  TableExpandedLineSnapshot,
  TableLineSnapshot,
  TableNodeId,
} from '../../runtime';

interface TableLineEventHandler<T> {
  (event: React.MouseEvent<HTMLDivElement>, line: TableDataLineSnapshot<T>): void;
}

type TableLineViewSize = 'sm' | 'md' | 'lg';

interface TableCellFactory<T, THeader, TActionContent> {
  (
    line: TableDataLineSnapshot<T>,
    column: TableColumnModel<THeader, TActionContent>,
    columnIndex: number,
  ): TableCellSnapshot<T>;
}

interface TableLineViewProps<T, THeader, TActionContent> {
  line: TableLineSnapshot<T>;
  rowIndex: number;
  size: TableLineViewSize;
  columnLayouts: TableColumnLayoutSnapshot<THeader, TActionContent>[];
  lastRowTriggerCellRef?: React.Ref<HTMLDivElement>;
  isInteractive: boolean;
  createCell: TableCellFactory<T, THeader, TActionContent>;
  renderCell(cell: TableCellSnapshot<T>): React.ReactNode;
  renderEmpty(): React.ReactNode;
  renderExpanded(line: TableExpandedLineSnapshot<T>): React.ReactNode;
  onNodeToggle(nodeId: TableNodeId): void;
  isNodeExpanded(nodeId: TableNodeId): boolean;
  onNodeExpandedToggle(nodeId: TableNodeId): void;
  isTreeEnabled: boolean;
  isTreeDefaultExpanded: boolean;
  treeToggledNodeIds: ReadonlySet<TableNodeId>;
  onTreeNodeToggle(nodeId: TableNodeId): void;
  onRowClick?: TableLineEventHandler<T>;
  onRowDoubleClick?: TableLineEventHandler<T>;
  onRowContextMenu?: TableLineEventHandler<T>;
}

const areColumnLayoutsEqual = <THeader, TActionContent>(
  left: TableColumnLayoutSnapshot<THeader, TActionContent>[],
  right: TableColumnLayoutSnapshot<THeader, TActionContent>[],
): boolean => {
  if (left === right) return true;
  if (left.length !== right.length) return false;

  for (let index = 0; index < left.length; index++) {
    const leftLayout = left[index];
    const rightLayout = right[index];

    if (!leftLayout || !rightLayout) return false;
    if (leftLayout.columnId !== rightLayout.columnId) return false;
    if (leftLayout.sourceIndex !== rightLayout.sourceIndex) return false;
    if (leftLayout.visualIndex !== rightLayout.visualIndex) return false;
    if (leftLayout.gridTemplateTrack !== rightLayout.gridTemplateTrack) return false;
    if (leftLayout.pin?.side !== rightLayout.pin?.side) return false;
    if (leftLayout.pin?.offset !== rightLayout.pin?.offset) return false;
    if (leftLayout.pin?.isBoundary !== rightLayout.pin?.isBoundary) return false;
    if (leftLayout.sort.isActive !== rightLayout.sort.isActive) return false;
    if (leftLayout.sort.direction !== rightLayout.sort.direction) return false;
    if (leftLayout.sort.isSortable !== rightLayout.sort.isSortable) return false;
    if (leftLayout.column.kind !== rightLayout.column.kind) return false;
    if (leftLayout.column.align !== rightLayout.column.align) return false;
  }

  return true;
};

const areLinesEqual = <T,>(left: TableLineSnapshot<T>, right: TableLineSnapshot<T>): boolean => {
  if (left === right) return true;
  if (left.id !== right.id) return false;
  if (left.kind !== right.kind) return false;
  if (left.visualIndex !== right.visualIndex) return false;

  if (left.kind === 'data' && right.kind === 'data') {
    return (
      left.selected === right.selected &&
      left.selectionIndeterminate === right.selectionIndeterminate &&
      left.node.nodeId === right.node.nodeId &&
      left.node.data === right.node.data &&
      left.node.depth === right.node.depth &&
      left.node.hasChildren === right.node.hasChildren &&
      left.node.parentNodeId === right.node.parentNodeId
    );
  }

  if (left.kind === 'empty' && right.kind === 'empty') {
    return left.columnSpan === right.columnSpan;
  }

  if (left.kind === 'expanded' && right.kind === 'expanded') {
    return left.node.nodeId === right.node.nodeId && left.node.data === right.node.data;
  }

  return false;
};

const areTableLineViewPropsEqual = <T, THeader, TActionContent>(
  left: TableLineViewProps<T, THeader, TActionContent>,
  right: TableLineViewProps<T, THeader, TActionContent>,
): boolean => {
  return (
    left.rowIndex === right.rowIndex &&
    left.size === right.size &&
    left.lastRowTriggerCellRef === right.lastRowTriggerCellRef &&
    left.isInteractive === right.isInteractive &&
    left.createCell === right.createCell &&
    left.renderCell === right.renderCell &&
    left.renderEmpty === right.renderEmpty &&
    left.renderExpanded === right.renderExpanded &&
    left.onNodeToggle === right.onNodeToggle &&
    left.isNodeExpanded === right.isNodeExpanded &&
    left.onNodeExpandedToggle === right.onNodeExpandedToggle &&
    left.isTreeEnabled === right.isTreeEnabled &&
    left.isTreeDefaultExpanded === right.isTreeDefaultExpanded &&
    left.treeToggledNodeIds === right.treeToggledNodeIds &&
    left.onTreeNodeToggle === right.onTreeNodeToggle &&
    left.onRowClick === right.onRowClick &&
    left.onRowDoubleClick === right.onRowDoubleClick &&
    left.onRowContextMenu === right.onRowContextMenu &&
    areLinesEqual(left.line, right.line) &&
    areColumnLayoutsEqual(left.columnLayouts, right.columnLayouts)
  );
};

const TableLineViewComponent = <T, THeader, TActionContent>(props: TableLineViewProps<T, THeader, TActionContent>) => {
  const [isLineHovered, setIsLineHovered] = React.useState(false);
  const isLineInteractiveHovered = props.isInteractive && isLineHovered;

  const handleMouseEnter = React.useCallback(() => {
    if (!props.isInteractive) return;

    setIsLineHovered(true);
  }, [props.isInteractive]);

  const handleMouseLeave = React.useCallback(() => {
    setIsLineHovered(false);
  }, []);

  React.useEffect(() => {
    if (props.isInteractive) return;

    setIsLineHovered(false);
  }, [props.isInteractive]);

  if (props.line.kind === 'empty') {
    return (
      <TableEmptyLineView
        line={props.line}
        rowIndex={props.rowIndex}
        size={props.size}
        renderEmpty={props.renderEmpty}
      />
    );
  }

  if (props.line.kind === 'expanded') {
    return <TableExpandedLineView line={props.line} rowIndex={props.rowIndex} renderExpanded={props.renderExpanded} />;
  }

  const line = props.line;

  return (
    <div
      className={s.line}
      role="row"
      aria-rowindex={props.rowIndex}
      aria-selected={line.selected || undefined}
      onMouseEnter={props.isInteractive ? handleMouseEnter : undefined}
      onMouseLeave={props.isInteractive ? handleMouseLeave : undefined}
      onClick={props.isInteractive ? (event) => props.onRowClick?.(event, line) : undefined}
      onDoubleClick={props.isInteractive ? (event) => props.onRowDoubleClick?.(event, line) : undefined}
      onContextMenu={props.isInteractive ? (event) => props.onRowContextMenu?.(event, line) : undefined}
    >
      {props.columnLayouts.map((layout) => {
        const cell = props.createCell(line, layout.column, layout.visualIndex);

        return (
          <TableCellView
            key={cell.id}
            cell={cell}
            cellRef={layout.visualIndex === 0 ? props.lastRowTriggerCellRef : undefined}
            layout={layout}
            line={line}
            size={props.size}
            isLineInteractive={props.isInteractive}
            isLineHovered={isLineInteractiveHovered}
            renderCell={props.renderCell}
            onNodeToggle={props.onNodeToggle}
            isNodeExpanded={props.isNodeExpanded}
            onNodeExpandedToggle={props.onNodeExpandedToggle}
            isTreeEnabled={props.isTreeEnabled}
            isTreeDefaultExpanded={props.isTreeDefaultExpanded}
            treeToggledNodeIds={props.treeToggledNodeIds}
            onTreeNodeToggle={props.onTreeNodeToggle}
          />
        );
      })}
    </div>
  );
};

export const TableLineView = React.memo(
  TableLineViewComponent,
  areTableLineViewPropsEqual,
) as typeof TableLineViewComponent;
