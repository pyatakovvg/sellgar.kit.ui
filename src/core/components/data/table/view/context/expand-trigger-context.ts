import React from 'react';

import type { TableNodeId } from '../../runtime';

export interface TableExpandTriggerContextValue {
  expanded: boolean;
  nodeId: TableNodeId;
  toggle(): void;
}

export const TableExpandTriggerContext = React.createContext<TableExpandTriggerContextValue | null>(null);

export const useTableExpandTriggerContext = (): TableExpandTriggerContextValue | null => {
  return React.useContext(TableExpandTriggerContext);
};
