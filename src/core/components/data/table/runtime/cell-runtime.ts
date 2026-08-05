import { createTableCellRendererId } from './render-runtime.ts';

import type { TableCellKind, TableCellSnapshot, TableColumnModel, TableLineId, TableNodeModel } from './types.ts';

const createDataCellId = (lineId: string, columnId: string): string => {
  return `${lineId}:cell:${columnId}`;
};

export class CellRuntime<T, THeader = unknown, TActionContent = unknown> {
  createCell(
    node: TableNodeModel<T>,
    lineId: TableLineId,
    rowSelected: boolean,
    column: TableColumnModel<THeader, TActionContent>,
    columnIndex: number,
  ): TableCellSnapshot<T> {
    const cellId = createDataCellId(lineId, column.columnId);
    const cellKind: TableCellKind =
      column.kind === 'selection' ? 'selection' : column.kind === 'tree' ? 'tree' : 'data';

    return {
      id: cellId,
      nodeId: node.nodeId,
      columnId: column.columnId,
      lineId,
      columnIndex,
      kind: cellKind,
      render: {
        rendererId: createTableCellRendererId(column.columnId),
        context: {
          row: node.data,
          node,
          nodeId: node.nodeId,
          rowIndex: node.index,
          rowSelected,
          columnId: column.columnId,
          columnIndex,
          cellId,
          lineId,
        },
      },
    };
  }
}
