import React from 'react';

import type { TableColumnGeometry } from '../../../../../../runtime/types';

export const HeadCellContext = React.createContext<TableColumnGeometry | null>(null);

export const useHeadCellColumn = (): TableColumnGeometry => {
  const column = React.useContext(HeadCellContext);
  if (!column) throw new Error('Head cell controls require their column provider.');
  return column;
};
