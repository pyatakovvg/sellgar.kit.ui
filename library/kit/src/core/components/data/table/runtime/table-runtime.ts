import { ColumnRuntime } from './column-runtime.ts';
import { ColumnLayoutRuntime } from './column-layout-runtime.ts';
import { assertTableInvariant } from './invariant.ts';
import { LineRuntime } from './line-runtime.ts';
import { NodeRuntime } from './node-runtime.ts';
import { SelectionRuntime } from './selection-runtime.ts';
import { TreeRuntime } from './tree-runtime.ts';

import type {
  TableColumnId,
  TableColumnModel,
  TableColumnWidths,
  TableNodeId,
  TableNodeModel,
  TableSnapshot,
  TableSortSnapshot,
} from './types.ts';
import type { TableNodeTreeOptions } from './node-runtime.ts';

export const TABLE2_TREE_COLUMN_ID: TableColumnId = '__table.tree__';
export const TABLE2_SELECTION_COLUMN_ID: TableColumnId = '__table.selection__';

export interface TableTreeInput<T extends object> {
  enabled?: boolean;
  accessor: keyof T;
  defaultExpanded?: boolean;
  toggledNodeIds?: ReadonlySet<TableNodeId>;
}

export interface TableSnapshotOptions<T extends object> {
  selectionEnabled?: boolean;
  selectedNodeIds?: readonly TableNodeId[];
  emptyLineEnabled?: boolean;
  expandedLineEnabled?: boolean;
  expandedNodeIds?: ReadonlySet<TableNodeId>;
  columnWidths?: TableColumnWidths;
  tree?: TableTreeInput<T>;
  sort?: TableSortSnapshot;
}

export interface TableRuntimeInput<
  T extends object,
  THeader = unknown,
  TActionContent = unknown,
> extends TableSnapshotOptions<T> {
  rows: T[];
  columns: TableColumnModel<THeader, TActionContent>[];
  tree?: TableTreeInput<T>;
}

const createSelectionColumn = <THeader, TActionContent>(): TableColumnModel<THeader, TActionContent> => {
  return {
    columnId: TABLE2_SELECTION_COLUMN_ID,
    kind: 'selection',
    actions: [],
    width: 40,
    order: Number.MIN_SAFE_INTEGER,
    pinLeft: true,
  };
};

const createTreeColumn = <THeader, TActionContent>(): TableColumnModel<THeader, TActionContent> => {
  return {
    columnId: TABLE2_TREE_COLUMN_ID,
    kind: 'tree',
    actions: [],
    width: 32,
    order: Number.MIN_SAFE_INTEGER + 1,
    pinLeft: true,
  };
};

export class TableRuntime<T extends object, THeader = unknown, TActionContent = unknown> {
  readonly nodes = new NodeRuntime<T>();
  readonly columns = new ColumnRuntime<THeader, TActionContent>();
  readonly columnLayout = new ColumnLayoutRuntime<THeader, TActionContent>();
  readonly lines = new LineRuntime<T, THeader, TActionContent>();
  readonly selection = new SelectionRuntime();
  readonly tree = new TreeRuntime<T>();

  setRows(rows: T[], tree?: TableNodeTreeOptions<T>): void {
    this.nodes.setData(rows, tree);
  }

  setColumns(columns: TableColumnModel<THeader, TActionContent>[]): void {
    this.columns.setColumns(columns);
  }

  sync(input: TableRuntimeInput<T, THeader, TActionContent>): void {
    this.setColumns(input.columns);
    this.setRows(input.rows, this.getNodeTreeOptions(input.tree));
  }

  getSelectedRows(selectedNodeIds: readonly TableNodeId[]): T[] {
    const selectedNodeIdSet = new Set(selectedNodeIds);

    return this.nodes
      .getNodes()
      .filter((node) => selectedNodeIdSet.has(node.nodeId))
      .map((node) => node.data);
  }

  toggleNodeSelection(
    selectedNodeIds: readonly TableNodeId[],
    nodeId: TableNodeId,
    tree?: TableTreeInput<T>,
  ): TableNodeId[] {
    if (tree?.enabled) {
      return this.selection.toggleNodeSubtree(
        selectedNodeIds,
        this.nodes.getSubtreeNodeIds(nodeId),
        this.getAncestorSubtreeNodeIds(nodeId),
      );
    }

    return this.selection.toggleNode(selectedNodeIds, nodeId);
  }

  toggleAllNodesSelection(selectedNodeIds: readonly TableNodeId[], tree?: TableTreeInput<T>): TableNodeId[] {
    const nodeIds = tree?.enabled ? this.getAllNodeIds() : this.getVisibleNodes(tree).map((node) => node.nodeId);

    return this.selection.toggleAll(selectedNodeIds, nodeIds);
  }

  clearPartialNodeSubtreeSelection(
    selectedNodeIds: readonly TableNodeId[],
    nodeId: TableNodeId,
  ): readonly TableNodeId[] {
    const selectionStatus = this.selection.getNodeStatuses(this.nodes.getNodes(), selectedNodeIds).get(nodeId);

    if (!selectionStatus?.indeterminate) return selectedNodeIds;

    return this.selection.clearNodeSubtree(
      selectedNodeIds,
      this.nodes.getSubtreeNodeIds(nodeId),
      this.getAncestorSubtreeNodeIds(nodeId),
    );
  }

  createSnapshot(input: TableRuntimeInput<T, THeader, TActionContent>): TableSnapshot<T, THeader, TActionContent> {
    this.sync(input);

    return this.snapshot({
      selectionEnabled: input.selectionEnabled,
      selectedNodeIds: input.selectedNodeIds,
      emptyLineEnabled: input.emptyLineEnabled,
      expandedLineEnabled: input.expandedLineEnabled,
      expandedNodeIds: input.expandedNodeIds,
      columnWidths: input.columnWidths,
      tree: input.tree,
      sort: input.sort,
    });
  }

  snapshot(options: TableSnapshotOptions<T> = {}): TableSnapshot<T, THeader, TActionContent> {
    const sourceColumns = this.columns.getColumns();
    const columns = [
      ...(options.selectionEnabled ? [createSelectionColumn<THeader, TActionContent>()] : []),
      ...(options.tree?.enabled ? [createTreeColumn<THeader, TActionContent>()] : []),
      ...sourceColumns,
    ];

    assertTableInvariant(
      sourceColumns.every((column) => column.columnId !== TABLE2_SELECTION_COLUMN_ID),
      `Table column id "${TABLE2_SELECTION_COLUMN_ID}" is reserved for row selection.`,
    );
    assertTableInvariant(
      sourceColumns.every((column) => column.columnId !== TABLE2_TREE_COLUMN_ID),
      `Table column id "${TABLE2_TREE_COLUMN_ID}" is reserved for tree controls.`,
    );

    const columnLayouts = this.columnLayout.createLayout(columns, options.sort, options.columnWidths);
    const visibleColumns = columnLayouts.map((layout) => layout.column);
    const allNodeIds = this.getAllNodeIds();
    const nodes = this.getVisibleNodes(options.tree);
    const nodeIds = nodes.map((node) => node.nodeId);
    const selectedNodeIds = options.selectionEnabled
      ? this.selection.retain(options.selectedNodeIds ?? [], allNodeIds)
      : [];
    const selectionScopeNodeIds = options.tree?.enabled ? allNodeIds : nodeIds;
    const selectionStatus = this.selection.getStatus(selectedNodeIds, selectionScopeNodeIds);
    const selectionStatusByNodeId = this.selection.getNodeStatuses(this.nodes.getNodes(), selectedNodeIds);

    return {
      nodeIds: allNodeIds,
      columns,
      columnLayouts,
      gridTemplateColumns: this.columnLayout.createGridTemplateColumns(columnLayouts),
      selection: {
        allSelected: selectionStatus.allSelected,
        indeterminate: selectionStatus.indeterminate,
        selectedNodeIds,
      },
      lines: this.lines.createLines(nodes, visibleColumns, selectedNodeIds, {
        emptyLineEnabled: options.emptyLineEnabled,
        expandedLineEnabled: options.expandedLineEnabled,
        expandedNodeIds: options.expandedNodeIds,
        selectionStatusByNodeId,
      }),
    };
  }

  private getAllNodeIds(): TableNodeId[] {
    return this.nodes.getNodes().map((node) => node.nodeId);
  }

  private getVisibleNodes(tree: TableTreeInput<T> | undefined): TableNodeModel<T>[] {
    return this.tree.getVisibleNodes(this.nodes.getNodes(), {
      enabled: tree?.enabled,
      defaultExpanded: tree?.defaultExpanded,
      toggledNodeIds: tree?.toggledNodeIds,
    });
  }

  private getNodeTreeOptions(tree: TableTreeInput<T> | undefined): TableNodeTreeOptions<T> | undefined {
    if (!tree?.enabled) return undefined;

    return {
      accessor: tree.accessor,
    };
  }

  private getAncestorSubtreeNodeIds(nodeId: TableNodeId): TableNodeId[][] {
    return this.nodes.getAncestorNodeIds(nodeId).map((ancestorNodeId) => this.nodes.getSubtreeNodeIds(ancestorNodeId));
  }
}
