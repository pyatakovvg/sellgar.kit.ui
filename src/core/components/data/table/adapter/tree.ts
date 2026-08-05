import React from 'react';

import { retainTableNodeIdSet } from './node-id-set.ts';

import type { TableNodeId } from '../runtime/types.ts';

export interface TableTreeAdapter {
  toggledNodeIds: ReadonlySet<TableNodeId>;
  toggleNode(nodeId: TableNodeId): void;
  retainToggledNodeIds(nodeIds: readonly TableNodeId[]): void;
}

export const useTableTree = (): TableTreeAdapter => {
  const [toggledNodeIds, setToggledNodeIds] = React.useState<ReadonlySet<TableNodeId>>(() => new Set());

  const toggleNode = React.useCallback((nodeId: TableNodeId) => {
    setToggledNodeIds((prevNodeIds) => {
      const nextNodeIds = new Set(prevNodeIds);

      if (nextNodeIds.has(nodeId)) {
        nextNodeIds.delete(nodeId);
      } else {
        nextNodeIds.add(nodeId);
      }

      return nextNodeIds;
    });
  }, []);
  const retainToggledNodeIds = React.useCallback((nodeIds: readonly TableNodeId[]) => {
    setToggledNodeIds((prevNodeIds) => retainTableNodeIdSet(prevNodeIds, nodeIds));
  }, []);

  return {
    toggledNodeIds,
    toggleNode,
    retainToggledNodeIds,
  };
};
