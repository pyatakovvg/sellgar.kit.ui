import type { TableControllerSelectionSnapshot } from './types.ts';

const EMPTY_ROWS: readonly object[] = [];

export const createInactiveSelectionSnapshot = <T extends object>(): TableControllerSelectionSnapshot<T> => ({
  ready: false,
  enabled: false,
  rows: EMPTY_ROWS as readonly T[],
  selectedCount: 0,
  allSelected: false,
  indeterminate: false,
  canClear: false,
  canSelectAll: false,
});

const areRowsEqual = <T extends object>(left: readonly T[], right: readonly T[]): boolean => {
  if (left.length !== right.length) return false;

  for (let index = 0; index < left.length; index++) {
    if (left[index] !== right[index]) return false;
  }

  return true;
};

export const areSelectionSnapshotsEqual = <T extends object>(
  left: TableControllerSelectionSnapshot<T>,
  right: TableControllerSelectionSnapshot<T>,
): boolean => {
  return (
    left.ready === right.ready &&
    left.enabled === right.enabled &&
    left.selectedCount === right.selectedCount &&
    left.allSelected === right.allSelected &&
    left.indeterminate === right.indeterminate &&
    left.canClear === right.canClear &&
    left.canSelectAll === right.canSelectAll &&
    areRowsEqual(left.rows, right.rows)
  );
};
