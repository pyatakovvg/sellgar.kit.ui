import React from 'react';

import { Scrollbar } from '../../shared';

import { useTableLastRowTrigger } from '../../adapter';
import { TableHeaderCellView } from '../header-cell';
import { TableLineView } from '../line';
import { useTableVirtualLines } from './hooks/use-virtual-lines.hook.ts';

import cn from 'classnames';
import s from './default.module.scss';

import type {
  TableCellSnapshot,
  TableColumnId,
  TableColumnModel,
  TableDataLineSnapshot,
  TableExpandedLineSnapshot,
  TableLineSnapshot,
  TableNodeId,
  TableSnapshot,
} from '../../runtime';
import type { TableLastRowTriggerConfig } from '../../adapter';

type TableViewSurface = 'standalone' | 'embedded';
type TableViewStyle = 'primary' | 'secondary';
type TableViewSize = 'sm' | 'md' | 'lg';
type TableViewLayoutScroll = 'internal' | 'external';

interface TableViewLayout {
  scroll: TableViewLayoutScroll;
  stickyHeader: {
    enabled: boolean;
    top: string;
  };
  virtualization: {
    enabled: boolean;
    rowHeight?: number;
    overscan: number;
  };
}

interface TableLineEventHandler<T> {
  (event: React.MouseEvent<HTMLDivElement>, line: TableDataLineSnapshot<T>): void;
}

interface TableCellFactory<T, THeader, TActionContent> {
  (
    line: TableDataLineSnapshot<T>,
    column: TableColumnModel<THeader, TActionContent>,
    columnIndex: number,
  ): TableCellSnapshot<T>;
}

interface TableColumnElementSetter {
  (columnId: TableColumnId, element: HTMLElement | null): void;
}

interface TableViewProps<T, THeader extends React.ReactNode> {
  snapshot: TableSnapshot<T, THeader, React.ReactNode>;
  surface: TableViewSurface;
  layout: TableViewLayout;
  tableStyle: TableViewStyle;
  size: TableViewSize;
  className?: string;
  setColumnElement: TableColumnElementSetter;
  isRowInteractive: boolean;
  createCell: TableCellFactory<T, THeader, React.ReactNode>;
  renderCell(cell: TableCellSnapshot<T>): React.ReactNode;
  renderEmpty(): React.ReactNode;
  renderExpanded(line: TableExpandedLineSnapshot<T>): React.ReactNode;
  onAllRowsToggle(): void;
  onNodeToggle(nodeId: TableNodeId): void;
  isNodeExpanded(nodeId: TableNodeId): boolean;
  onNodeExpandedToggle(nodeId: TableNodeId): void;
  isTreeEnabled: boolean;
  isTreeDefaultExpanded: boolean;
  treeToggledNodeIds: ReadonlySet<TableNodeId>;
  onTreeNodeToggle(nodeId: TableNodeId): void;
  onColumnSortToggle(columnId: TableColumnId): void;
  lastRowTrigger?: TableLastRowTriggerConfig<T>;
  onRowClick?: TableLineEventHandler<T>;
  onRowDoubleClick?: TableLineEventHandler<T>;
  onRowContextMenu?: TableLineEventHandler<T>;
}

const TABLE_ROW_HEIGHT_BY_SIZE: Record<TableViewSize, number> = {
  lg: 64,
  md: 54,
  sm: 40,
};

const canVirtualizeLines = <T,>(lines: TableLineSnapshot<T>[]): boolean => {
  for (const line of lines) {
    if (line.kind !== 'data') return false;
  }

  return true;
};

export const TableView = <T, THeader extends React.ReactNode>(props: TableViewProps<T, THeader>) => {
  const contentRef = React.useRef<HTMLDivElement>(null);
  const rowCount = props.snapshot.lines.length + 1;
  const columnCount = props.snapshot.columnLayouts.length;
  const isVirtualizationEnabled = props.layout.virtualization.enabled && canVirtualizeLines(props.snapshot.lines);
  const virtualLines = useTableVirtualLines({
    enabled: isVirtualizationEnabled,
    lineCount: props.snapshot.lines.length,
    rowHeight: props.layout.virtualization.rowHeight ?? TABLE_ROW_HEIGHT_BY_SIZE[props.size],
    overscan: props.layout.virtualization.overscan,
    scrollMode: props.layout.scroll,
    contentRef,
  });
  const visibleLines = virtualLines.enabled
    ? props.snapshot.lines.slice(virtualLines.startIndex, virtualLines.endIndex)
    : props.snapshot.lines;
  const lastDataLine = React.useMemo((): TableDataLineSnapshot<T> | null => {
    for (let index = visibleLines.length - 1; index >= 0; index--) {
      const line = visibleLines[index];

      if (line?.kind === 'data') return line;
    }

    return null;
  }, [visibleLines]);
  const lastRowTriggerCellRef = useTableLastRowTrigger({
    line: lastDataLine,
    config: props.lastRowTrigger,
  });

  const wrapperClassName = cn(
    s.wrapper,
    {
      [s.wrapperStandalone]: props.surface === 'standalone',
      [s.wrapperEmbedded]: props.surface === 'embedded',
    },
    props.className,
  );

  const content = (
    <div
      ref={contentRef}
      className={s.content}
      role="table"
      aria-rowcount={rowCount}
      aria-colcount={columnCount}
      style={{ gridTemplateColumns: props.snapshot.gridTemplateColumns }}
    >
      <div className={s.headerLine} role="row" aria-rowindex={1}>
        {props.snapshot.columnLayouts.map((layout) => (
          <TableHeaderCellView
            key={layout.columnId}
            layout={layout}
            stickyHeader={props.layout.stickyHeader}
            size={props.size}
            tableStyle={props.tableStyle}
            setColumnElement={props.setColumnElement}
            selection={props.snapshot.selection}
            onAllRowsToggle={props.onAllRowsToggle}
            onColumnSortToggle={props.onColumnSortToggle}
          />
        ))}
      </div>

      {virtualLines.enabled && virtualLines.topSpacerHeight > 0 && (
        <div
          className={s.virtualSpacer}
          role="presentation"
          style={{
            gridColumn: `span ${columnCount}`,
            height: virtualLines.topSpacerHeight,
          }}
        />
      )}

      {visibleLines.map((line) => (
        <TableLineView
          key={line.id}
          line={line}
          rowIndex={line.visualIndex + 2}
          size={props.size}
          columnLayouts={props.snapshot.columnLayouts}
          lastRowTriggerCellRef={line.id === lastDataLine?.id ? lastRowTriggerCellRef : undefined}
          isInteractive={props.isRowInteractive}
          createCell={props.createCell}
          renderCell={props.renderCell}
          renderEmpty={props.renderEmpty}
          renderExpanded={props.renderExpanded}
          onNodeToggle={props.onNodeToggle}
          isNodeExpanded={props.isNodeExpanded}
          onNodeExpandedToggle={props.onNodeExpandedToggle}
          isTreeEnabled={props.isTreeEnabled}
          isTreeDefaultExpanded={props.isTreeDefaultExpanded}
          treeToggledNodeIds={props.treeToggledNodeIds}
          onTreeNodeToggle={props.onTreeNodeToggle}
          onRowClick={props.onRowClick}
          onRowDoubleClick={props.onRowDoubleClick}
          onRowContextMenu={props.onRowContextMenu}
        />
      ))}

      {virtualLines.enabled && virtualLines.bottomSpacerHeight > 0 && (
        <div
          className={s.virtualSpacer}
          role="presentation"
          style={{
            gridColumn: `span ${columnCount}`,
            height: virtualLines.bottomSpacerHeight,
          }}
        />
      )}
    </div>
  );

  if (props.layout.scroll === 'external') {
    return <div className={wrapperClassName}>{content}</div>;
  }

  return (
    <Scrollbar className={wrapperClassName} onScroll={virtualLines.onScroll}>
      {content}
    </Scrollbar>
  );
};
