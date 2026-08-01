import React from 'react';

import { ArrowDownSFillIcon, ArrowRightSFillIcon } from '../../../../../icons';

import { TableSelectionCheckboxView } from './selection-checkbox-view.tsx';
import { TableCellDataContext, createTableCellDataContextValue } from './cell-data-context.ts';
import { TableExpandTriggerContext } from './expand-trigger-context.ts';
import { getTablePinnedStyle } from './view-helpers.ts';

import cn from 'classnames';
import s from './cell-view.module.scss';

import type {
  TableCellSnapshot,
  TableColumnLayoutSnapshot,
  TableDataLineSnapshot,
  TableNodeId,
  TableTextAlign,
} from '../runtime/types.ts';

type TableCellViewSize = 'sm' | 'md' | 'lg';

interface TableCellViewProps<T, THeader, TActionContent> {
  cell: TableCellSnapshot<T>;
  cellRef?: React.Ref<HTMLDivElement>;
  layout: TableColumnLayoutSnapshot<THeader, TActionContent>;
  line: TableDataLineSnapshot<T>;
  size: TableCellViewSize;
  isLineInteractive: boolean;
  isLineHovered: boolean;
  renderCell(cell: TableCellSnapshot<T>): React.ReactNode;
  onNodeToggle(nodeId: TableNodeId): void;
  isNodeExpanded(nodeId: TableNodeId): boolean;
  onNodeExpandedToggle(nodeId: TableNodeId): void;
  isTreeEnabled: boolean;
  isTreeDefaultExpanded: boolean;
  treeToggledNodeIds: ReadonlySet<TableNodeId>;
  onTreeNodeToggle(nodeId: TableNodeId): void;
}

const isTreeNodeExpanded = (
  nodeId: TableNodeId,
  defaultExpanded: boolean,
  toggledNodeIds: ReadonlySet<TableNodeId>,
): boolean => {
  const isToggled = toggledNodeIds.has(nodeId);

  return defaultExpanded ? !isToggled : isToggled;
};

const getTableCellAlignClassName = (align: TableTextAlign | undefined): string => {
  return cn({
    [s.alignRight]: align === 'right',
    [s.alignCenter]: align === 'center',
  });
};

const getTableCellPinnedClassName = <THeader, TActionContent>(
  layout: TableColumnLayoutSnapshot<THeader, TActionContent>,
): string => {
  return cn({
    [s.pinnedCell]: Boolean(layout.pin),
    [s.pinnedLeftBoundary]: layout.pin?.side === 'left' && layout.pin.isBoundary,
    [s.pinnedRightBoundary]: layout.pin?.side === 'right' && layout.pin.isBoundary,
  });
};

const getTableCellSizeClassName = (size: TableCellViewSize): string => {
  return cn({
    [s['size--lg']]: size === 'lg',
    [s['size--md']]: size === 'md',
    [s['size--sm']]: size === 'sm',
  });
};

export const TableCellView = <T, THeader, TActionContent>(props: TableCellViewProps<T, THeader, TActionContent>) => {
  const isSeparated = props.line.visualIndex > 0;
  const column = props.layout.column;
  const pinnedClassName = getTableCellPinnedClassName(props.layout);
  const pinnedStyle = getTablePinnedStyle(props.layout, 20);
  const sizeClassName = getTableCellSizeClassName(props.size);
  const expandTriggerContext = React.useMemo(
    () => ({
      expanded: props.isNodeExpanded(props.line.node.nodeId),
      nodeId: props.line.node.nodeId,
      toggle: () => props.onNodeExpandedToggle(props.line.node.nodeId),
    }),
    [props.isNodeExpanded, props.line.node.nodeId, props.onNodeExpandedToggle],
  );
  const cellDataContext = React.useMemo(
    () =>
      createTableCellDataContextValue(
        props.cell.render.context,
        expandTriggerContext.expanded,
        expandTriggerContext.toggle,
      ),
    [expandTriggerContext.expanded, expandTriggerContext.toggle, props.cell.render.context],
  );

  if (props.cell.kind === 'selection') {
    return (
      <div
        ref={props.cellRef}
        className={cn(s.cell, s.selectionCell, sizeClassName, pinnedClassName, {
          [s.cellSeparated]: isSeparated,
          [s.selectedCell]: props.line.selected,
          [s.cellInteractive]: props.isLineInteractive,
          [s.cellLineHovered]: props.isLineHovered,
        })}
        style={pinnedStyle}
        role="cell"
        aria-colindex={props.cell.columnIndex + 1}
        data-row-event-ignore=""
      >
        <TableSelectionCheckboxView
          checked={props.line.selected}
          isIndeterminate={props.line.selectionIndeterminate}
          ariaLabel="Выбрать строку"
          onChange={() => {
            props.onNodeToggle(props.line.node.nodeId);
          }}
        />
      </div>
    );
  }

  if (props.cell.kind === 'tree') {
    const node = props.line.node;
    const expanded = isTreeNodeExpanded(node.nodeId, props.isTreeDefaultExpanded, props.treeToggledNodeIds);

    return (
      <div
        ref={props.cellRef}
        className={cn(s.cell, s.treeCell, sizeClassName, pinnedClassName, {
          [s.cellSeparated]: isSeparated,
          [s.selectedCell]: props.line.selected,
          [s.cellInteractive]: props.isLineInteractive,
          [s.cellLineHovered]: props.isLineHovered,
        })}
        style={pinnedStyle}
        role="cell"
        aria-colindex={props.cell.columnIndex + 1}
        data-row-event-ignore=""
      >
        {props.isTreeEnabled && node.hasChildren && (
          <button
            className={s.treeTrigger}
            type="button"
            aria-label={expanded ? 'Свернуть строку' : 'Развернуть строку'}
            aria-expanded={expanded}
            onClick={() => props.onTreeNodeToggle(node.nodeId)}
          >
            {expanded ? <ArrowDownSFillIcon /> : <ArrowRightSFillIcon />}
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      ref={props.cellRef}
      className={cn(s.cell, getTableCellAlignClassName(column.align), sizeClassName, pinnedClassName, {
        [s.cellSeparated]: isSeparated,
        [s.selectedCell]: props.line.selected,
        [s.cellInteractive]: props.isLineInteractive,
        [s.cellLineHovered]: props.isLineHovered,
      })}
      style={pinnedStyle}
      role="cell"
      aria-colindex={props.cell.columnIndex + 1}
    >
      <TableCellDataContext.Provider value={cellDataContext}>
        <TableExpandTriggerContext.Provider value={expandTriggerContext}>
          {props.renderCell(props.cell)}
        </TableExpandTriggerContext.Provider>
      </TableCellDataContext.Provider>
    </div>
  );
};
