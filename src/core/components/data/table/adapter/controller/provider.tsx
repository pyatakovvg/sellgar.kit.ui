import React from 'react';

import { TableControllerContext } from './context.ts';
import { TableControllerStore } from './store.ts';

interface TableControllerProviderProps {
  children?: React.ReactNode;
}

export const TableControllerProvider: React.FC<TableControllerProviderProps> = (props) => {
  const controllerRef = React.useRef<TableControllerStore | null>(null);

  if (!controllerRef.current) {
    controllerRef.current = new TableControllerStore();
  }

  return (
    <TableControllerContext.Provider value={controllerRef.current}>{props.children}</TableControllerContext.Provider>
  );
};
