import React from 'react';

import { Actions } from '../actions/actions';
import { Cell } from '../cell/cell';
import { Head } from '../head/head';
import { compileActions } from './compile-actions';
import { resolveColumnSize } from './resolve-column-size';
import { visitDeclarations } from './visit-declarations';

import type { TableColumnDefinition } from '../../core/column';
import type {
  TableActionsProps,
  TableCellProps,
  TableColumnProps,
  TableColumnRenderers,
  TableColumnScope,
  TableHeadProps,
} from '../types';

export const compileColumn = <T>(
  element: React.ReactElement<TableColumnProps<T>>,
  sourceIndex: number,
): { column: TableColumnDefinition; renderers: TableColumnRenderers<T> } => {
  const props = element.props;
  const columnId = element.key === null ? `column:${sourceIndex}` : `key:${element.key}`;
  const scope: TableColumnScope<T> = { Head, Cell, Actions };
  const children = typeof props.children === 'function' ? props.children(scope) : props.children;
  let head: React.ReactElement<TableHeadProps> | undefined;
  let cell: React.ReactElement<TableCellProps<T>> | undefined;
  let actions: React.ReactElement<TableActionsProps> | undefined;

  visitDeclarations(children, (child) => {
    if (child.type === Head && React.isValidElement<TableHeadProps>(child)) {
      if (head) throw new Error(`Table column "${columnId}" contains duplicate Head declarations.`);

      head = child;
      return;
    }

    if (child.type === Cell && React.isValidElement<TableCellProps<T>>(child)) {
      if (cell) throw new Error(`Table column "${columnId}" contains duplicate Cell declarations.`);

      cell = child;
      return;
    }

    if (child.type === Actions && React.isValidElement<TableActionsProps>(child)) {
      if (actions) throw new Error(`Table column "${columnId}" contains duplicate Actions declarations.`);

      actions = child;
      return;
    }

    throw new Error(`Table column "${columnId}" accepts only Head, Cell and Actions declarations.`);
  });

  if (!cell) throw new Error(`Table column "${columnId}" requires a Cell declaration.`);

  const cellProps = cell.props;

  return {
    column: {
      columnId,
      sourceIndex,
      width:
        typeof props.width === 'string' && /^\s*var\(\s*--numbers-/.test(props.width)
          ? resolveColumnSize(props.width, columnId, 'width')
          : props.width,
      minWidth: resolveColumnSize(props.minWidth, columnId, 'minWidth'),
      maxWidth: resolveColumnSize(props.maxWidth, columnId, 'maxWidth'),
      align: props.align,
      order: props.order,
      visible: props.visible,
      resizable: props.resizable === true,
      pinLeft: props.pinLeft,
      pinRight: props.pinRight,
      sort: props.sort,
    },
    renderers: {
      header: head?.props.label ?? null,
      actions: actions ? compileActions(actions.props) : [],
      cell: cellProps.render ?? (() => cellProps.children),
    },
  };
};
