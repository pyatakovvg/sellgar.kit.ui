import React from 'react';

import type {
  TableColumnId,
  TableColumnModel,
  TableColumnSortConfig,
  TableSortDirection,
  TableSortSnapshot,
} from '../runtime/types.ts';

export interface TableSortAdapter {
  snapshot: TableSortSnapshot;
  onColumnSortToggle(columnId: TableColumnId): void;
}

const getNextSortDirection = (direction: TableSortDirection | undefined): TableSortDirection => {
  if (!direction) return 'asc';
  if (direction === 'asc') return 'desc';

  return 'asc';
};

const getInitialSortSnapshot = <THeader>(columns: readonly TableColumnModel<THeader>[]): TableSortSnapshot => {
  const initialColumn = columns.find((column) => column.visible !== false && column.sort?.directionDefault);

  if (!initialColumn?.sort?.directionDefault) return {};

  return {
    activeColumnId: initialColumn.columnId,
    direction: initialColumn.sort.directionDefault,
  };
};

const isColumnSortable = <THeader>(
  column: TableColumnModel<THeader> | undefined,
): column is TableColumnModel<THeader> & { sort: TableColumnSortConfig } => {
  return Boolean(column?.sort && column.visible !== false);
};

export const useTableSort = <THeader>(columns: readonly TableColumnModel<THeader>[]): TableSortAdapter => {
  const columnById = React.useMemo(() => {
    const nextColumnById = new Map<TableColumnId, TableColumnModel<THeader>>();

    for (const column of columns) {
      nextColumnById.set(column.columnId, column);
    }

    return nextColumnById;
  }, [columns]);

  const initialSnapshot = React.useMemo(() => getInitialSortSnapshot(columns), [columns]);
  const [snapshot, setSnapshot] = React.useState<TableSortSnapshot>(initialSnapshot);

  React.useEffect(() => {
    if (snapshot.activeColumnId || !initialSnapshot.activeColumnId) return;

    setSnapshot(initialSnapshot);
  }, [initialSnapshot, snapshot.activeColumnId]);
  React.useEffect(() => {
    if (!snapshot.activeColumnId) return;

    const activeColumn = columnById.get(snapshot.activeColumnId);

    if (isColumnSortable(activeColumn)) return;

    activeColumn?.sort?.onReset?.();
    setSnapshot({});
  }, [columnById, snapshot.activeColumnId]);

  const onColumnSortToggle = React.useCallback(
    (columnId: TableColumnId) => {
      const nextColumn = columnById.get(columnId);

      if (!isColumnSortable(nextColumn)) return;

      const previousColumn =
        snapshot.activeColumnId && snapshot.activeColumnId !== columnId
          ? columnById.get(snapshot.activeColumnId)
          : undefined;
      const nextDirection = snapshot.activeColumnId === columnId ? getNextSortDirection(snapshot.direction) : 'asc';

      previousColumn?.sort?.onReset?.();
      nextColumn.sort.onToggle(nextDirection);

      setSnapshot({
        activeColumnId: columnId,
        direction: nextDirection,
      });
    },
    [columnById, snapshot.activeColumnId, snapshot.direction],
  );

  return {
    snapshot,
    onColumnSortToggle,
  };
};
