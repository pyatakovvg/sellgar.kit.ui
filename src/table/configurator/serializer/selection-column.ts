import { TABLE_SELECTION_COLUMN_ID } from '../../core/column';
import { resolveColumnSize } from './resolve-column-size';

import type { TableColumnDefinition } from '../../core/column';

export const createSelectionColumn = (): TableColumnDefinition => {
  const width = resolveColumnSize('var(--numbers-40)', TABLE_SELECTION_COLUMN_ID, 'width');
  return {
    columnId: TABLE_SELECTION_COLUMN_ID,
    sourceIndex: -1,
    order: -Number.MAX_VALUE,
    width,
    minWidth: width,
    maxWidth: width,
    align: 'center',
    pinLeft: true,
    resizable: false,
  };
};
