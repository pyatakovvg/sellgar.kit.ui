import type { TableNodeSelectionStatus } from './selection-runtime.ts';
import type { TableSelectionModel } from './selection-runtime.ts';
import type { TableColumnModel, TableLineSnapshot, TableNodeId, TableNodeModel } from './types.ts';

const createDataLineId = (nodeId: TableNodeId): string => {
  return `data:${nodeId}`;
};

const createExpandedLineId = (nodeId: TableNodeId): string => {
  return `expanded:${nodeId}`;
};

const TABLE2_EMPTY_LINE_ID = 'empty';

export interface TableCreateLinesOptions {
  emptyLineEnabled?: boolean;
  expandedLineEnabled?: boolean;
  expandedNodeIds?: ReadonlySet<TableNodeId>;
  selectionStatusByNodeId?: ReadonlyMap<TableNodeId, TableNodeSelectionStatus>;
}

export class LineRuntime<T, THeader = unknown, TActionContent = unknown> {
  createLines(
    nodes: TableNodeModel<T>[],
    columns: TableColumnModel<THeader, TActionContent>[],
    selection: TableSelectionModel,
    options: TableCreateLinesOptions = {},
  ): TableLineSnapshot<T>[] {
    if (nodes.length === 0 && options.emptyLineEnabled) {
      return [
        {
          id: TABLE2_EMPTY_LINE_ID,
          kind: 'empty',
          visualIndex: 0,
          columnSpan: Math.max(columns.length, 1),
        },
      ];
    }

    const lines: TableLineSnapshot<T>[] = [];

    let visualIndex = 0;

    for (const node of nodes) {
      const lineId = createDataLineId(node.nodeId);
      const selectionStatus = options.selectionStatusByNodeId?.get(node.nodeId);
      const selected = selectionStatus?.selected ?? this.isNodeSelected(selection, node.nodeId);

      lines.push({
        id: lineId,
        kind: 'data',
        visualIndex,
        node,
        selected,
        selectionIndeterminate: selectionStatus?.indeterminate ?? false,
      });

      if (options.expandedLineEnabled && options.expandedNodeIds?.has(node.nodeId)) {
        const expandedLineId = createExpandedLineId(node.nodeId);
        visualIndex += 1;

        lines.push({
          id: expandedLineId,
          kind: 'expanded',
          visualIndex,
          node,
          columnSpan: Math.max(columns.length, 1),
          render: {
            row: node.data,
            node,
            nodeId: node.nodeId,
            rowIndex: node.index,
            lineId: expandedLineId,
          },
        });
      }

      visualIndex += 1;
    }

    return lines;
  }

  private isNodeSelected(selection: TableSelectionModel, nodeId: TableNodeId): boolean {
    const isIncluded = selection.nodeIds.has(nodeId);

    return selection.type === 'include' ? isIncluded : !isIncluded;
  }
}
