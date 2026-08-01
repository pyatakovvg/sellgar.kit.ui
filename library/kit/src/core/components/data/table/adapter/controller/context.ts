import React from 'react';

import type { TableControllerStore } from './store.ts';

export const TableControllerContext = React.createContext<TableControllerStore | null>(null);

export const useTableControllerOptional = (): TableControllerStore | null => {
  return React.useContext(TableControllerContext);
};

export const useTableController = (): TableControllerStore => {
  const controller = React.useContext(TableControllerContext);

  if (!controller) {
    throw new Error('useTableControllerSelection must be used inside Table.ControllerProvider.');
  }

  return controller;
};
