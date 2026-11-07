import React from 'react';

import { validateTableColumns } from '../../core/validate-columns';
import { Column } from '../column/column';
import { Empty } from '../empty/empty';
import { Expand } from '../expand/expand';
import { compileColumn } from './compile-column';
import { visitDeclarations } from './visit-declarations';

import type { TableColumnDefinition } from '../../core/column';
import type {
  TableColumnProps,
  TableColumnRenderers,
  TableConfiguration,
  TableConfigurationInput,
  TableExpandProps,
  TableRenderers,
  TableRootScope,
} from '../types';

export const compileTableConfiguration = <T extends object>(
  input: TableConfigurationInput<T>,
): TableConfiguration<T> => {
  const columns: TableColumnDefinition[] = [];
  const columnRenderers = new Map<string, TableColumnRenderers<T>>();
  const scope: TableRootScope<T> = { Column, Empty, Expand };
  let empty: TableRenderers<T>['empty'];
  let expanded: TableRenderers<T>['expanded'];
  const children = typeof input.children === 'function' ? input.children(scope) : input.children;

  visitDeclarations(children, (element) => {
    if (element.type === Column && React.isValidElement<TableColumnProps<T>>(element)) {
      const result = compileColumn(element, columns.length);

      columns.push(result.column);
      columnRenderers.set(result.column.columnId, result.renderers);
      return;
    }

    if (element.type === Empty && React.isValidElement<React.PropsWithChildren>(element)) {
      if (empty) throw new Error('Table configuration contains duplicate Empty declarations.');

      empty = () => element.props.children;
      return;
    }

    if (element.type === Expand && React.isValidElement<TableExpandProps<T>>(element)) {
      if (expanded) throw new Error('Table configuration contains duplicate Expand declarations.');

      expanded = element.props.render ?? (() => element.props.children);
      return;
    }

    throw new Error('Table configuration accepts only Column, Empty and Expand declarations.');
  });

  validateTableColumns(columns);

  const { children: declarations, ...props } = input;

  return {
    ...props,
    columns,
    renderers: { columns: columnRenderers, empty, expanded },
  };
};
