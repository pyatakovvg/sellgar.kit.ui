import type { TableNodeId } from '../runtime/types.ts';

export const retainTableNodeIdSet = (
  currentNodeIds: ReadonlySet<TableNodeId>,
  availableNodeIds: readonly TableNodeId[],
): ReadonlySet<TableNodeId> => {
  const availableNodeIdSet = new Set(availableNodeIds);
  const nextNodeIds = new Set<TableNodeId>();

  for (const nodeId of currentNodeIds) {
    if (availableNodeIdSet.has(nodeId)) {
      nextNodeIds.add(nodeId);
    }
  }

  if (currentNodeIds.size !== nextNodeIds.size) return nextNodeIds;

  for (const nodeId of currentNodeIds) {
    if (!nextNodeIds.has(nodeId)) return nextNodeIds;
  }

  return currentNodeIds;
};
