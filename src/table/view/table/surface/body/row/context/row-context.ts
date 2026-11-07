import React from 'react';

import type { TableRowGeometry } from '../../../../../../runtime/types';

export const RowContext = React.createContext<TableRowGeometry | null>(null);

export const useTableRow = (): TableRowGeometry => {
  const row = React.useContext(RowContext);
  if (!row) throw new Error('Table row children require their row provider.');
  return row;
};
