import React from 'react';

import { retainTableNodeIdSet } from './node-id-set.ts';

import type { TableNodeId } from '../runtime/types.ts';

export interface TableExpansionAdapter {
  expandedNodeIds: ReadonlySet<TableNodeId>;
  isNodeExpanded(nodeId: TableNodeId): boolean;
  toggleNodeExpanded(nodeId: TableNodeId): void;
  retainExpandedNodeIds(nodeIds: readonly TableNodeId[]): void;
}

export const useTableExpansion = (): TableExpansionAdapter => {
  const [expandedNodeIds, setExpandedNodeIds] = React.useState<ReadonlySet<TableNodeId>>(() => new Set());

  const isNodeExpanded = React.useCallback(
    (nodeId: TableNodeId): boolean => {
      return expandedNodeIds.has(nodeId);
    },
    [expandedNodeIds],
  );

  const toggleNodeExpanded = React.useCallback((nodeId: TableNodeId) => {
    setExpandedNodeIds((prevNodeIds) => {
      const nextNodeIds = new Set(prevNodeIds);

      if (nextNodeIds.has(nodeId)) {
        nextNodeIds.delete(nodeId);
      } else {
        nextNodeIds.add(nodeId);
      }

      return nextNodeIds;
    });
  }, []);
  const retainExpandedNodeIds = React.useCallback((nodeIds: readonly TableNodeId[]) => {
    setExpandedNodeIds((prevNodeIds) => retainTableNodeIdSet(prevNodeIds, nodeIds));
  }, []);

  return {
    expandedNodeIds,
    isNodeExpanded,
    toggleNodeExpanded,
    retainExpandedNodeIds,
  };
};
