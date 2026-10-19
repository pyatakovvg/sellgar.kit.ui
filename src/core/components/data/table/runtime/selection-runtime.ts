import type { TableNodeId, TableNodeModel } from './types.ts';

export type TableSelectionModelType = 'include' | 'exclude';

export interface TableSelectionModel {
  type: TableSelectionModelType;
  nodeIds: ReadonlySet<TableNodeId>;
}

export interface TableSelectionStatus {
  allSelected: boolean;
  indeterminate: boolean;
}

export interface TableNodeSelectionStatus {
  selected: boolean;
  indeterminate: boolean;
}

export const createEmptyTableSelectionModel = (): TableSelectionModel => ({
  type: 'include',
  nodeIds: new Set<TableNodeId>(),
});

export class SelectionRuntime {
  isNodeSelected(selection: TableSelectionModel, nodeId: TableNodeId): boolean {
    const isIncluded = selection.nodeIds.has(nodeId);

    return selection.type === 'include' ? isIncluded : !isIncluded;
  }

  toggleNode(selection: TableSelectionModel, nodeId: TableNodeId): TableSelectionModel {
    const nextNodeIds = new Set(selection.nodeIds);
    const isSelected = this.isNodeSelected(selection, nodeId);

    if (selection.type === 'include') {
      if (isSelected) {
        nextNodeIds.delete(nodeId);
      } else {
        nextNodeIds.add(nodeId);
      }
    } else {
      if (isSelected) {
        nextNodeIds.add(nodeId);
      } else {
        nextNodeIds.delete(nodeId);
      }
    }

    return {
      type: selection.type,
      nodeIds: nextNodeIds,
    };
  }

  toggleNodeSubtree(
    selection: TableSelectionModel,
    subtreeNodeIds: readonly TableNodeId[],
    ancestorSubtreeNodeIds: readonly TableNodeId[][],
  ): TableSelectionModel {
    const nextNodeIds = new Set(selection.nodeIds);
    const nextSelection: TableSelectionModel = {
      type: selection.type,
      nodeIds: nextNodeIds,
    };
    const allSelected =
      subtreeNodeIds.length > 0 && subtreeNodeIds.every((nodeId) => this.isNodeSelected(selection, nodeId));

    if (allSelected) {
      for (const nodeId of subtreeNodeIds) {
        if (selection.type === 'include') {
          nextNodeIds.delete(nodeId);
        } else {
          nextNodeIds.add(nodeId);
        }
      }
    } else {
      for (const nodeId of subtreeNodeIds) {
        if (selection.type === 'include') {
          nextNodeIds.add(nodeId);
        } else {
          nextNodeIds.delete(nodeId);
        }
      }
    }

    this.normalizeAncestorSelection(nextSelection, ancestorSubtreeNodeIds);

    return nextSelection;
  }

  clearNodeSubtree(
    selection: TableSelectionModel,
    subtreeNodeIds: readonly TableNodeId[],
    ancestorSubtreeNodeIds: readonly TableNodeId[][],
  ): TableSelectionModel {
    const nextNodeIds = new Set(selection.nodeIds);
    const nextSelection: TableSelectionModel = {
      type: selection.type,
      nodeIds: nextNodeIds,
    };

    for (const nodeId of subtreeNodeIds) {
      if (selection.type === 'include') {
        nextNodeIds.delete(nodeId);
      } else {
        nextNodeIds.add(nodeId);
      }
    }

    this.normalizeAncestorSelection(nextSelection, ancestorSubtreeNodeIds);

    return nextSelection;
  }

  toggleAll(selection: TableSelectionModel, nodeIds: readonly TableNodeId[]): TableSelectionModel {
    const nextNodeIds = new Set(selection.nodeIds);
    const allSelected = nodeIds.length > 0 && nodeIds.every((nodeId) => this.isNodeSelected(selection, nodeId));

    if (allSelected) {
      return createEmptyTableSelectionModel();
    }

    if (selection.type === 'include') {
      return {
        type: 'exclude',
        nodeIds: new Set<TableNodeId>(),
      };
    }

    for (const nodeId of nodeIds) {
      nextNodeIds.delete(nodeId);
    }

    return {
      type: selection.type,
      nodeIds: nextNodeIds,
    };
  }

  getStatus(selection: TableSelectionModel, nodeIds: readonly TableNodeId[]): TableSelectionStatus {
    let selectedVisibleCount = 0;

    for (const nodeId of nodeIds) {
      if (this.isNodeSelected(selection, nodeId)) {
        selectedVisibleCount += 1;
      }
    }

    return {
      allSelected: nodeIds.length > 0 && selectedVisibleCount === nodeIds.length,
      indeterminate: selectedVisibleCount > 0 && selectedVisibleCount < nodeIds.length,
    };
  }

  getNodeStatuses<T>(
    nodes: readonly TableNodeModel<T>[],
    selection: TableSelectionModel,
  ): Map<TableNodeId, TableNodeSelectionStatus> {
    const selectedCountByNodeId = new Map<TableNodeId, number>();
    const totalCountByNodeId = new Map<TableNodeId, number>();
    const statusByNodeId = new Map<TableNodeId, TableNodeSelectionStatus>();

    for (let index = nodes.length - 1; index >= 0; index--) {
      const node = nodes[index];
      const childSelectedCount = selectedCountByNodeId.get(node.nodeId) ?? 0;
      const childTotalCount = totalCountByNodeId.get(node.nodeId) ?? 0;
      const selectedCount = childSelectedCount + (this.isNodeSelected(selection, node.nodeId) ? 1 : 0);
      const totalCount = childTotalCount + 1;

      statusByNodeId.set(node.nodeId, {
        selected: selectedCount === totalCount,
        indeterminate: selectedCount > 0 && selectedCount < totalCount,
      });

      if (node.parentNodeId) {
        selectedCountByNodeId.set(
          node.parentNodeId,
          (selectedCountByNodeId.get(node.parentNodeId) ?? 0) + selectedCount,
        );
        totalCountByNodeId.set(node.parentNodeId, (totalCountByNodeId.get(node.parentNodeId) ?? 0) + totalCount);
      }
    }

    return statusByNodeId;
  }

  materialize(selection: TableSelectionModel, nodeIds: readonly TableNodeId[]): TableNodeId[] {
    const selectedNodeIds: TableNodeId[] = [];

    for (const nodeId of nodeIds) {
      if (this.isNodeSelected(selection, nodeId)) {
        selectedNodeIds.push(nodeId);
      }
    }

    return selectedNodeIds;
  }

  retain(selection: TableSelectionModel, nodeIds: readonly TableNodeId[]): TableSelectionModel {
    const nodeIdSet = new Set(nodeIds);
    const nextNodeIds = new Set<TableNodeId>();

    for (const nodeId of selection.nodeIds) {
      if (nodeIdSet.has(nodeId)) {
        nextNodeIds.add(nodeId);
      }
    }

    return {
      type: selection.type,
      nodeIds: nextNodeIds,
    };
  }

  private normalizeAncestorSelection(
    selection: TableSelectionModel,
    ancestorSubtreeNodeIds: readonly TableNodeId[][],
  ): void {
    const selectedNodeIds = selection.nodeIds as Set<TableNodeId>;

    for (const subtreeNodeIds of ancestorSubtreeNodeIds) {
      const ancestorNodeId = subtreeNodeIds[0];

      if (!ancestorNodeId) continue;

      let allDescendantsSelected = true;

      for (let index = 1; index < subtreeNodeIds.length; index++) {
        if (!this.isNodeSelected(selection, subtreeNodeIds[index])) {
          allDescendantsSelected = false;
          break;
        }
      }

      if (selection.type === 'include' && allDescendantsSelected) {
        selectedNodeIds.add(ancestorNodeId);
      } else if (selection.type === 'include') {
        selectedNodeIds.delete(ancestorNodeId);
      } else if (allDescendantsSelected) {
        selectedNodeIds.delete(ancestorNodeId);
      } else {
        selectedNodeIds.add(ancestorNodeId);
      }
    }
  }
}
