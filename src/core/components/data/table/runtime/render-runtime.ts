import type { TableColumnId, TableRendererId } from './types.ts';

export const createTableCellRendererId = (columnId: TableColumnId): TableRendererId => {
  return `cell:${columnId}`;
};
