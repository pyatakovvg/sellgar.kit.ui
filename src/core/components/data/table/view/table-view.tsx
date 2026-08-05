import React from 'react';

import { Scrollbar } from '../../../..';

import { useTableLastRowTrigger } from '../adapter/last-row-trigger.ts';
import { TableHeaderCellView } from './header-cell-view.tsx';
import { TableLineView } from './line-view.tsx';

import cn from 'classnames';
import s from './table-view.module.scss';

import type {
  TableCellSnapshot,
  TableColumnId,
  TableColumnLayoutSnapshot,
  TableColumnModel,
  TableDataLineSnapshot,
  TableExpandedLineSnapshot,
  TableLineSnapshot,
  TableNodeId,
  TableSnapshot,
} from '../runtime/types.ts';
import type { TableLastRowTriggerConfig } from '../adapter/last-row-trigger.ts';

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

export const TableView = <T, THeader extends React.ReactNode>(props: TableViewProps<T, THeader>) => {
  const rowCount = props.snapshot.lines.length + 1;
  const columnCount = props.snapshot.columnLayouts.length;
  const lastDataLine = React.useMemo((): TableDataLineSnapshot<T> | null => {
    for (let index = props.snapshot.lines.length - 1; index >= 0; index--) {
      const line = props.snapshot.lines[index];

      if (line?.kind === 'data') return line;
    }

    return null;
  }, [props.snapshot.lines]);
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
            tableStyle={props.tableStyle}
            setColumnElement={props.setColumnElement}
            selection={props.snapshot.selection}
            onAllRowsToggle={props.onAllRowsToggle}
            onColumnSortToggle={props.onColumnSortToggle}
          />
        ))}
      </div>

      {props.snapshot.lines.map((line) => (
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
    </div>
  );

  if (props.layout.scroll === 'external') {
    return <div className={wrapperClassName}>{content}</div>;
  }

  return <Scrollbar className={wrapperClassName}>{content}</Scrollbar>;
};
