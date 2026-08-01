import React from 'react';

import { assertTableInvariant } from '../runtime/invariant.ts';
import { createTableCellRendererId } from '../runtime/render-runtime.ts';

import { Action, Actions, createTableColumnActionsScope } from './actions.tsx';
import { Cell } from './cell.tsx';
import { Column, createTableColumnScope } from './column.tsx';
import { Empty } from './empty.tsx';
import { Expand } from './expand.tsx';
import { ExpandTrigger } from './expand-trigger.tsx';
import { Head } from './head.tsx';

import type { TableColumnActionProps, TableColumnActionsProps } from './actions.tsx';
import type { TableCellProps } from './cell.tsx';
import type { TableColumnProps } from './column.tsx';
import type { TableEmptyProps } from './empty.tsx';
import type { TableExpandProps } from './expand.tsx';
import type { TableHeadProps } from './head.tsx';
import type {
  TableCellRenderContext,
  TableCellSnapshot,
  TableColumnActionModel,
  TableColumnId,
  TableColumnModel,
  TableExpandedRenderContext,
  TableRendererId,
  TableTextAlign,
} from '../runtime/types.ts';

export interface TableCellRenderer<T> {
  (context: TableCellRenderContext<T>): React.ReactNode;
}

type TableColumnHeader = Exclude<React.ReactNode, undefined>;
type TableColumnActionContent = React.ReactNode;

export interface TableColumnDefinition extends TableColumnModel<TableColumnHeader, TableColumnActionContent> {}

export interface TableCompiledSchema<T> {
  columns: TableColumnDefinition[];
  columnById: ReadonlyMap<TableColumnId, TableColumnDefinition>;
  renderRegistry: TableRenderRegistry<T>;
  hasEmpty: boolean;
  hasExpand: boolean;
}

export class TableRenderRegistry<T> {
  private readonly cellRenderers = new Map<TableRendererId, TableCellRenderer<T>>();
  private emptyRenderer: (() => React.ReactNode) | null = null;
  private expandRenderer: ((context: TableExpandedRenderContext<T>) => React.ReactNode) | null = null;

  registerCell(columnId: TableColumnId, renderer: TableCellRenderer<T>): void {
    const rendererId = createTableCellRendererId(columnId);

    assertTableInvariant(
      !this.cellRenderers.has(rendererId),
      `Table cell renderer "${rendererId}" is already registered.`,
    );

    this.cellRenderers.set(rendererId, renderer);
  }

  renderCell(cell: TableCellSnapshot<T>): React.ReactNode {
    const renderer = this.cellRenderers.get(cell.render.rendererId);

    assertTableInvariant(renderer, `Table cell renderer "${cell.render.rendererId}" is not registered.`);

    return renderer(cell.render.context);
  }

  registerEmpty(renderer: () => React.ReactNode): void {
    assertTableInvariant(!this.emptyRenderer, 'Table must contain only one Table.Empty.');

    this.emptyRenderer = renderer;
  }

  hasEmpty(): boolean {
    return Boolean(this.emptyRenderer);
  }

  renderEmpty(): React.ReactNode {
    return this.emptyRenderer?.() ?? null;
  }

  registerExpand(renderer: (context: TableExpandedRenderContext<T>) => React.ReactNode): void {
    assertTableInvariant(!this.expandRenderer, 'Table must contain only one Table.Expand.');

    this.expandRenderer = renderer;
  }

  hasExpand(): boolean {
    return Boolean(this.expandRenderer);
  }

  renderExpanded(context: TableExpandedRenderContext<T>): React.ReactNode {
    return this.expandRenderer?.(context) ?? null;
  }
}

type TableRootSchemaPart = 'column' | 'empty' | 'expand';
type TableColumnSchemaPart = 'head' | 'actions' | 'cell';
type TableColumnActionsSchemaPart = 'action';

const isIgnorableSchemaNode = (node: React.ReactNode): boolean => {
  return node === null || node === undefined || typeof node === 'boolean';
};

const isSchemaFragment = (node: React.ReactNode): node is React.ReactElement<React.PropsWithChildren> => {
  return React.isValidElement(node) && node.type === React.Fragment;
};

const getRootSchemaPart = (node: React.ReactNode): TableRootSchemaPart | null => {
  if (!React.isValidElement(node)) return null;

  if (node.type === Column) return 'column';
  if (node.type === Empty) return 'empty';
  if (node.type === Expand) return 'expand';

  return null;
};

const getColumnSchemaPart = (node: React.ReactNode): TableColumnSchemaPart | null => {
  if (!React.isValidElement(node)) return null;

  if (node.type === Head) return 'head';
  if (node.type === Actions) return 'actions';
  if (node.type === Cell) return 'cell';

  return null;
};

const getColumnActionsSchemaPart = (node: React.ReactNode): TableColumnActionsSchemaPart | null => {
  if (!React.isValidElement(node)) return null;

  if (node.type === Action) return 'action';

  return null;
};

const forEachSchemaChild = (children: React.ReactNode, callback: (child: React.ReactNode) => void): void => {
  React.Children.forEach(children, (child) => {
    if (isIgnorableSchemaNode(child)) return;

    if (isSchemaFragment(child)) {
      forEachSchemaChild(child.props.children, callback);
      return;
    }

    callback(child);
  });
};

const createStaticChildrenRenderer = (children: React.ReactNode): (() => React.ReactNode) => {
  return () => children;
};

const createFallbackCellRenderer = <T>(
  children: React.ReactNode,
): ((context: TableCellRenderContext<T>) => React.ReactNode) => {
  return () => children;
};

const createColumnId = (columnElement: React.ReactElement, sourceIndex: number): TableColumnId => {
  if (columnElement.key !== null) return `key:${String(columnElement.key)}`;

  return `column:${sourceIndex}`;
};

export class TableSchemaCompiler<T> {
  compile(children: React.ReactNode): TableCompiledSchema<T> {
    const columns: TableColumnDefinition[] = [];
    const columnById = new Map<TableColumnId, TableColumnDefinition>();
    const renderRegistry = new TableRenderRegistry<T>();

    forEachSchemaChild(children, (child) => {
      const schemaPart = getRootSchemaPart(child);

      assertTableInvariant(
        schemaPart !== null,
        'Table children must contain only Table.Column, Table.Empty or Table.Expand elements.',
      );

      if (schemaPart === 'empty') {
        const emptyElement = child as React.ReactElement<React.PropsWithChildren<TableEmptyProps>>;

        renderRegistry.registerEmpty(createStaticChildrenRenderer(emptyElement.props.children));
        return;
      }

      if (schemaPart === 'expand') {
        const expandElement = child as React.ReactElement<React.PropsWithChildren<TableExpandProps<T>>>;

        renderRegistry.registerExpand(
          expandElement.props.render ?? createStaticChildrenRenderer(expandElement.props.children),
        );
        return;
      }

      const sourceIndex = columns.length;
      const compiledColumn = this.compileColumn(child as React.ReactElement<TableColumnProps<T>>, sourceIndex);
      const column = compiledColumn.column;

      assertTableInvariant(!columnById.has(column.columnId), `Table column id "${column.columnId}" is duplicated.`);

      columns.push(column);
      columnById.set(column.columnId, column);
      renderRegistry.registerCell(column.columnId, compiledColumn.renderCell);
    });

    assertTableInvariant(columns.length > 0, 'Table must contain at least one Table.Column.');

    return {
      columns,
      columnById,
      renderRegistry,
      hasEmpty: renderRegistry.hasEmpty(),
      hasExpand: renderRegistry.hasExpand(),
    };
  }

  private compileColumn(
    columnElement: React.ReactElement<TableColumnProps<T>>,
    sourceIndex: number,
  ): {
    column: TableColumnDefinition;
    renderCell: TableCellRenderer<T>;
  } {
    const columnProps = columnElement.props;
    const columnId = createColumnId(columnElement, sourceIndex);
    const columnLabel = `#${sourceIndex + 1}`;

    let header: TableColumnHeader = null;
    let actions: readonly TableColumnActionModel<unknown, TableColumnActionContent>[] = [];
    let renderCell: TableCellRenderer<T> | null = null;
    let headCount = 0;
    let actionsCount = 0;
    let cellCount = 0;

    const columnChildren =
      typeof columnProps.children === 'function'
        ? columnProps.children(createTableColumnScope<T>())
        : columnProps.children;

    forEachSchemaChild(columnChildren, (columnChild) => {
      const schemaPart = getColumnSchemaPart(columnChild);

      if (schemaPart === 'head') {
        headCount += 1;

        assertTableInvariant(headCount === 1, `Table column ${columnLabel} must contain only one Table.Head.`);

        const headElement = columnChild as React.ReactElement<TableHeadProps>;
        header = headElement.props.label ?? null;
        return;
      }

      if (schemaPart === 'actions') {
        actionsCount += 1;

        assertTableInvariant(actionsCount === 1, `Table column ${columnLabel} must contain only one Table.Actions.`);

        actions = this.compileColumnActions(columnChild as React.ReactElement<TableColumnActionsProps>);
        return;
      }

      if (schemaPart === 'cell') {
        cellCount += 1;

        assertTableInvariant(cellCount === 1, `Table column ${columnLabel} must contain only one Table.Cell.`);

        const cellElement = columnChild as React.ReactElement<React.PropsWithChildren<TableCellProps<T>>>;
        const cellRender = cellElement.props.render;

        renderCell = cellRender
          ? (context) => cellRender({ ...context, ExpandTrigger })
          : createFallbackCellRenderer<T>(cellElement.props.children);
        return;
      }

      assertTableInvariant(
        false,
        `Table column ${columnLabel} children must contain only Table.Head, Table.Actions or Table.Cell elements.`,
      );
    });

    assertTableInvariant(renderCell !== null, `Table column ${columnLabel} must contain Table.Cell.`);

    return {
      column: {
        columnId,
        kind: 'data',
        header,
        actions,
        align: columnProps.align as TableTextAlign | undefined,
        sort: columnProps.sort,
        width: columnProps.width,
        order: columnProps.order,
        visible: columnProps.visible,
        pinLeft: columnProps.pinLeft,
        pinRight: columnProps.pinRight,
      },
      renderCell,
    };
  }

  private compileColumnActions(
    actionsElement: React.ReactElement<TableColumnActionsProps>,
  ): readonly TableColumnActionModel<unknown, TableColumnActionContent>[] {
    const actions: TableColumnActionModel<unknown, TableColumnActionContent>[] = [];
    const actionChildren =
      typeof actionsElement.props.children === 'function'
        ? actionsElement.props.children(createTableColumnActionsScope())
        : actionsElement.props.children;

    forEachSchemaChild(actionChildren, (actionChild) => {
      const schemaPart = getColumnActionsSchemaPart(actionChild);

      assertTableInvariant(schemaPart !== null, 'Table.Actions children must contain only Table.Action elements.');

      const actionElement = actionChild as React.ReactElement<TableColumnActionProps<unknown>>;
      const actionProps = actionElement.props;

      actions.push({
        state: actionProps.state,
        disabled: actionProps.disabled,
        onAction: actionProps.onAction,
        render: actionProps.children,
      });
    });

    return actions;
  }
}

export const createTableSchema = <T>(children: React.ReactNode): TableCompiledSchema<T> => {
  return new TableSchemaCompiler<T>().compile(children);
};
