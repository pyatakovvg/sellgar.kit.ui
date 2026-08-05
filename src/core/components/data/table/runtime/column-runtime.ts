import { assertTableInvariant } from './invariant.ts';

import type { TableColumnId, TableColumnModel } from './types.ts';

export class ColumnRuntime<THeader = unknown, TActionContent = unknown> {
  private _columns: TableColumnModel<THeader, TActionContent>[] = [];
  private _columnById = new Map<TableColumnId, TableColumnModel<THeader, TActionContent>>();

  setColumns(columns: TableColumnModel<THeader, TActionContent>[]): void {
    const nextColumns: TableColumnModel<THeader, TActionContent>[] = [];
    const nextColumnById = new Map<TableColumnId, TableColumnModel<THeader, TActionContent>>();

    for (const column of columns) {
      assertTableInvariant(
        !nextColumnById.has(column.columnId),
        `Table column id "${column.columnId}" is duplicated.`,
      );

      nextColumns.push(column);
      nextColumnById.set(column.columnId, column);
    }

    this._columns = nextColumns;
    this._columnById = nextColumnById;
  }

  getColumns(): TableColumnModel<THeader, TActionContent>[] {
    return this._columns;
  }

  getColumn(id: TableColumnId): TableColumnModel<THeader, TActionContent> | undefined {
    return this._columnById.get(id);
  }
}
