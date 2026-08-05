import React from 'react';

import { Typography } from '../../shared';

import { TableHeaderActionsView } from '../header-actions';
import { TableSelectionCheckboxView } from '../selection-checkbox';
import { TableSortIconView } from '../sort-icon';
import { getTablePinnedStyle } from '../shared';

import cn from 'classnames';
import s from './default.module.scss';

import type { TableColumnId, TableColumnLayoutSnapshot, TableSelectionSnapshot, TableTextAlign } from '../../runtime';

type TableHeaderCellViewSize = 'sm' | 'md' | 'lg';
type TableAriaSort = 'ascending' | 'descending' | 'none';
type TableHeaderCellStyle = 'primary' | 'secondary';

interface TableHeaderCellViewProps<THeader extends React.ReactNode> {
  layout: TableColumnLayoutSnapshot<THeader, React.ReactNode>;
  stickyHeader: {
    enabled: boolean;
    top: string;
  };
  size: TableHeaderCellViewSize;
  tableStyle: TableHeaderCellStyle;
  setColumnElement(columnId: TableColumnId, element: HTMLElement | null): void;
  selection: TableSelectionSnapshot;
  onAllRowsToggle(): void;
  onColumnSortToggle(columnId: TableColumnId): void;
}

const renderHeaderContent = (header: React.ReactNode): React.ReactNode => {
  if (React.isValidElement(header)) return header;

  return (
    <Typography size="caption-l">
      <p className={s.headerLabel}>{header}</p>
    </Typography>
  );
};

const renderHeaderText = (header: React.ReactNode): React.ReactNode => {
  return <div className={s.headerText}>{renderHeaderContent(header)}</div>;
};

const getAriaSort = <THeader extends React.ReactNode>(
  layout: TableColumnLayoutSnapshot<THeader, React.ReactNode>,
): TableAriaSort | undefined => {
  if (!layout.sort.isSortable) return undefined;
  if (!layout.sort.isActive || !layout.sort.direction) return 'none';

  return layout.sort.direction === 'asc' ? 'ascending' : 'descending';
};

const getHeaderCellStyle = <THeader extends React.ReactNode>(
  layout: TableColumnLayoutSnapshot<THeader, React.ReactNode>,
  stickyHeader: TableHeaderCellViewProps<THeader>['stickyHeader'],
): React.CSSProperties | undefined => {
  const pinnedStyle = getTablePinnedStyle(layout, 30);

  if (!stickyHeader.enabled) return pinnedStyle;

  return {
    position: 'sticky',
    top: stickyHeader.top,
    zIndex: 10,
    ...pinnedStyle,
  };
};

const getTableHeaderAlignClassName = (align: TableTextAlign | undefined): string => {
  return cn({
    [s.alignRight]: align === 'right',
    [s.alignCenter]: align === 'center',
  });
};

const getTableHeaderPinnedClassName = <THeader extends React.ReactNode>(
  layout: TableColumnLayoutSnapshot<THeader, React.ReactNode>,
): string => {
  return cn({
    [s.pinnedLeftBoundary]: layout.pin?.side === 'left' && layout.pin.isBoundary,
    [s.pinnedRightBoundary]: layout.pin?.side === 'right' && layout.pin.isBoundary,
  });
};

const getTableHeaderSizeClassName = (size: TableHeaderCellViewSize): string => {
  return cn({
    [s['size--lg']]: size === 'lg',
    [s['size--md']]: size === 'md',
    [s['size--sm']]: size === 'sm',
  });
};

const isHeaderControlTarget = (target: EventTarget | null): boolean => {
  return target instanceof Element && Boolean(target.closest('[data-table-header-control]'));
};

export const TableHeaderCellView = <THeader extends React.ReactNode>(props: TableHeaderCellViewProps<THeader>) => {
  const [isActionsOpen, setIsActionsOpen] = React.useState(false);
  const column = props.layout.column;
  const columnId = props.layout.columnId;
  const isSortable = props.layout.sort.isSortable;
  const hasActions = column.kind === 'data' && column.actions.length > 0;
  const isInteractive = isSortable || hasActions;
  const hasControls = isSortable || hasActions;
  const sizeClassName = getTableHeaderSizeClassName(props.size);
  const contentClassName = cn(s.headerContent, getTableHeaderAlignClassName(column.align), {
    [s.headerContentWithControls]: hasControls,
  });
  const handleCellRef = React.useCallback(
    (element: HTMLDivElement | null) => {
      props.setColumnElement(columnId, element);
    },
    [columnId, props.setColumnElement],
  );

  const sortControl = isSortable ? (
    <span className={s.headerSortIcon} aria-hidden="true">
      <TableSortIconView sort={props.layout.sort} />
    </span>
  ) : null;

  const actionsControl = hasActions ? (
    <TableHeaderActionsView actions={column.actions} open={isActionsOpen} onOpenChange={setIsActionsOpen} />
  ) : null;
  const controlsContent =
    column.align === 'right' ? (
      <>
        {actionsControl}
        {sortControl}
      </>
    ) : (
      <>
        {sortControl}
        {actionsControl}
      </>
    );
  const controls = hasControls ? <div className={s.headerControls}>{controlsContent}</div> : null;
  const headerText = renderHeaderText(column.header);
  const headerContentChildren =
    column.align === 'right' ? (
      <>
        {controls}
        {headerText}
      </>
    ) : (
      <>
        {headerText}
        {controls}
      </>
    );

  const handleSortClick = React.useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (isHeaderControlTarget(event.target)) return;

      props.onColumnSortToggle(column.columnId);
    },
    [column.columnId, props.onColumnSortToggle],
  );

  const handleSortKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (isHeaderControlTarget(event.target)) return;
      if (event.key !== 'Enter' && event.key !== ' ') return;

      event.preventDefault();
      props.onColumnSortToggle(column.columnId);
    },
    [column.columnId, props.onColumnSortToggle],
  );

  const headerContent = <div className={contentClassName}>{headerContentChildren}</div>;

  return (
    <div
      ref={handleCellRef}
      className={cn(s.headerCell, sizeClassName, getTableHeaderPinnedClassName(props.layout), {
        [s.selectionCell]: column.kind === 'selection',
        [s.headerCellInteractive]: isInteractive,
        [s.headerCellSortable]: isSortable,
        [s.headerCellStylePrimary]: props.tableStyle === 'primary',
        [s.headerCellStyleSecondary]: props.tableStyle === 'secondary',
      })}
      style={getHeaderCellStyle(props.layout, props.stickyHeader)}
      role="columnheader"
      tabIndex={isSortable ? 0 : undefined}
      aria-colindex={props.layout.visualIndex + 1}
      aria-sort={getAriaSort(props.layout)}
      data-row-event-ignore={column.kind === 'selection' || isSortable ? '' : undefined}
      onClick={isSortable ? handleSortClick : undefined}
      onKeyDown={isSortable ? handleSortKeyDown : undefined}
    >
      {column.kind === 'selection' ? (
        <TableSelectionCheckboxView
          checked={props.selection.allSelected}
          isIndeterminate={props.selection.indeterminate}
          ariaLabel="Выбрать все строки"
          onChange={props.onAllRowsToggle}
        />
      ) : (
        headerContent
      )}
    </div>
  );
};
