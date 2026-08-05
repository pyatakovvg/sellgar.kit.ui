import type { TableNodeId, TableNodeModel } from './types.ts';

export interface TableSelectionStatus {
  allSelected: boolean;
  indeterminate: boolean;
}

export interface TableNodeSelectionStatus {
  selected: boolean;
  indeterminate: boolean;
}

export class SelectionRuntime {
  toggleNode(selectedNodeIds: readonly TableNodeId[], nodeId: TableNodeId): TableNodeId[] {
    const nextSelectedNodeIds = new Set(selectedNodeIds);

    if (nextSelectedNodeIds.has(nodeId)) {
      nextSelectedNodeIds.delete(nodeId);
    } else {
      nextSelectedNodeIds.add(nodeId);
    }

    return Array.from(nextSelectedNodeIds);
  }

  toggleNodeSubtree(
    selectedNodeIds: readonly TableNodeId[],
    subtreeNodeIds: readonly TableNodeId[],
    ancestorSubtreeNodeIds: readonly TableNodeId[][],
  ): TableNodeId[] {
    const nextSelectedNodeIds = new Set(selectedNodeIds);
    const allSelected = subtreeNodeIds.length > 0 && subtreeNodeIds.every((nodeId) => nextSelectedNodeIds.has(nodeId));

    if (allSelected) {
      for (const nodeId of subtreeNodeIds) {
        nextSelectedNodeIds.delete(nodeId);
      }
    } else {
      for (const nodeId of subtreeNodeIds) {
        nextSelectedNodeIds.add(nodeId);
      }
    }

    this.normalizeAncestorSelection(nextSelectedNodeIds, ancestorSubtreeNodeIds);

    return Array.from(nextSelectedNodeIds);
  }

  clearNodeSubtree(
    selectedNodeIds: readonly TableNodeId[],
    subtreeNodeIds: readonly TableNodeId[],
    ancestorSubtreeNodeIds: readonly TableNodeId[][],
  ): TableNodeId[] {
    const nextSelectedNodeIds = new Set(selectedNodeIds);

    for (const nodeId of subtreeNodeIds) {
      nextSelectedNodeIds.delete(nodeId);
    }

    this.normalizeAncestorSelection(nextSelectedNodeIds, ancestorSubtreeNodeIds);

    return Array.from(nextSelectedNodeIds);
  }

  toggleAll(selectedNodeIds: readonly TableNodeId[], nodeIds: readonly TableNodeId[]): TableNodeId[] {
    const nextSelectedNodeIds = new Set(selectedNodeIds);
    const allSelected = nodeIds.length > 0 && nodeIds.every((nodeId) => nextSelectedNodeIds.has(nodeId));

    if (allSelected) {
      for (const nodeId of nodeIds) {
        nextSelectedNodeIds.delete(nodeId);
      }

      return Array.from(nextSelectedNodeIds);
    }

    for (const nodeId of nodeIds) {
      nextSelectedNodeIds.add(nodeId);
    }

    return Array.from(nextSelectedNodeIds);
  }

  getStatus(selectedNodeIds: readonly TableNodeId[], nodeIds: readonly TableNodeId[]): TableSelectionStatus {
    const selectedNodeIdSet = new Set(selectedNodeIds);
    const selectedVisibleCount = nodeIds.filter((nodeId) => selectedNodeIdSet.has(nodeId)).length;

    return {
      allSelected: nodeIds.length > 0 && selectedVisibleCount === nodeIds.length,
      indeterminate: selectedVisibleCount > 0 && selectedVisibleCount < nodeIds.length,
    };
  }

  getNodeStatuses<T>(
    nodes: readonly TableNodeModel<T>[],
    selectedNodeIds: readonly TableNodeId[],
  ): Map<TableNodeId, TableNodeSelectionStatus> {
    const selectedNodeIdSet = new Set(selectedNodeIds);
    const selectedCountByNodeId = new Map<TableNodeId, number>();
    const totalCountByNodeId = new Map<TableNodeId, number>();
    const statusByNodeId = new Map<TableNodeId, TableNodeSelectionStatus>();

    for (let index = nodes.length - 1; index >= 0; index--) {
      const node = nodes[index];
      const childSelectedCount = selectedCountByNodeId.get(node.nodeId) ?? 0;
      const childTotalCount = totalCountByNodeId.get(node.nodeId) ?? 0;
      const selectedCount = childSelectedCount + (selectedNodeIdSet.has(node.nodeId) ? 1 : 0);
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

  retain(selectedNodeIds: readonly TableNodeId[], nodeIds: readonly TableNodeId[]): TableNodeId[] {
    const visibleNodeIds = new Set(nodeIds);
    const nextSelectedNodeIds = new Set<TableNodeId>();

    for (const nodeId of selectedNodeIds) {
      if (visibleNodeIds.has(nodeId)) {
        nextSelectedNodeIds.add(nodeId);
      }
    }

    return Array.from(nextSelectedNodeIds);
  }

  private normalizeAncestorSelection(
    selectedNodeIds: Set<TableNodeId>,
    ancestorSubtreeNodeIds: readonly TableNodeId[][],
  ): void {
    for (const subtreeNodeIds of ancestorSubtreeNodeIds) {
      const ancestorNodeId = subtreeNodeIds[0];

      if (!ancestorNodeId) continue;

      let allDescendantsSelected = true;

      for (let index = 1; index < subtreeNodeIds.length; index++) {
        if (!selectedNodeIds.has(subtreeNodeIds[index])) {
          allDescendantsSelected = false;
          break;
        }
      }

      if (allDescendantsSelected) {
        selectedNodeIds.add(ancestorNodeId);
      } else {
        selectedNodeIds.delete(ancestorNodeId);
      }
    }
  }
}
