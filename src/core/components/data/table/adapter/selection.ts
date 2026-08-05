import React from 'react';

import type { TableNodeId } from '../runtime/types.ts';

export interface TableSelectionAdapter {
  selectedNodeIds: readonly TableNodeId[];
  setSelectedNodeIds(nodeIds: readonly TableNodeId[]): void;
  retainSelectedNodeIds(nodeIds: readonly TableNodeId[]): void;
}

const areNodeIdListsEqual = (left: readonly TableNodeId[], right: readonly TableNodeId[]): boolean => {
  if (left.length !== right.length) return false;

  for (let index = 0; index < left.length; index++) {
    if (left[index] !== right[index]) return false;
  }

  return true;
};

export const useTableSelection = (): TableSelectionAdapter => {
  const [selectedNodeIds, setSelectedNodeIds] = React.useState<readonly TableNodeId[]>([]);
  const retainSelectedNodeIds = React.useCallback((nodeIds: readonly TableNodeId[]) => {
    setSelectedNodeIds((prevNodeIds) => (areNodeIdListsEqual(prevNodeIds, nodeIds) ? prevNodeIds : nodeIds));
  }, []);

  return {
    selectedNodeIds,
    setSelectedNodeIds,
    retainSelectedNodeIds,
  };
};
