import React from 'react';

import { createEmptyTableSelectionModel } from '../runtime/selection-runtime.ts';

import type { TableSelectionModel } from '../runtime/selection-runtime.ts';
import type { TableNodeId } from '../runtime/types.ts';

export interface TableSelectionAdapter {
  selection: TableSelectionModel;
  setSelection(selection: TableSelectionModel): void;
  retainSelection(selection: TableSelectionModel): void;
}

const areNodeIdSetsEqual = (left: ReadonlySet<TableNodeId>, right: ReadonlySet<TableNodeId>): boolean => {
  if (left.size !== right.size) return false;

  for (const nodeId of left) {
    if (!right.has(nodeId)) return false;
  }

  return true;
};

const areSelectionModelsEqual = (left: TableSelectionModel, right: TableSelectionModel): boolean => {
  return left.type === right.type && areNodeIdSetsEqual(left.nodeIds, right.nodeIds);
};

export const useTableSelection = (): TableSelectionAdapter => {
  const [selection, setSelection] = React.useState<TableSelectionModel>(() => createEmptyTableSelectionModel());
  const retainSelection = React.useCallback((nextSelection: TableSelectionModel) => {
    setSelection((previousSelection) =>
      areSelectionModelsEqual(previousSelection, nextSelection) ? previousSelection : nextSelection,
    );
  }, []);

  return {
    selection,
    setSelection,
    retainSelection,
  };
};
