import React from 'react';

import { TableCellView } from './cell-view.tsx';
import { TableEmptyLineView } from './empty-line-view.tsx';
import { TableExpandedLineView } from './expanded-line-view.tsx';

import s from './line-view.module.scss';

import type {
  TableCellSnapshot,
  TableColumnLayoutSnapshot,
  TableColumnModel,
  TableDataLineSnapshot,
  TableExpandedLineSnapshot,
  TableLineSnapshot,
  TableNodeId,
} from '../runtime/types.ts';

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

export const TableLineView = <T, THeader, TActionContent>(props: TableLineViewProps<T, THeader, TActionContent>) => {
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
