import type { TableColumnDefinition } from './column';

const validateSize = (columnId: string, name: string, value: number | undefined): void => {
  if (value !== undefined && (!Number.isFinite(value) || value < 0)) {
    throw new Error(`Table column "${columnId}": ${name} must be a finite non-negative number.`);
  }
};

export const validateTableColumns = (columns: readonly TableColumnDefinition[]): void => {
  if (columns.length === 0) {
    throw new Error('Table configuration must contain at least one Column.');
  }

  const ids = new Set<string>();

  for (const column of columns) {
    if (ids.has(column.columnId)) {
      throw new Error(`Duplicate Table column id "${column.columnId}". Use unique React keys.`);
    }

    ids.add(column.columnId);
    validateSize(column.columnId, 'width', typeof column.width === 'number' ? column.width : undefined);
    validateSize(column.columnId, 'minWidth', column.minWidth);
    validateSize(column.columnId, 'maxWidth', column.maxWidth);

    if (column.minWidth !== undefined && column.maxWidth !== undefined && column.minWidth > column.maxWidth) {
      throw new Error(`Table column "${column.columnId}": minWidth must not exceed maxWidth.`);
    }

    if (column.pinLeft && column.pinRight) {
      throw new Error(`Table column "${column.columnId}" cannot be pinned on both sides.`);
    }

    if (column.order !== undefined && !Number.isFinite(column.order)) {
      throw new Error(`Table column "${column.columnId}": order must be finite.`);
    }
  }

  const visibleColumns = columns.filter((column) => column.visible !== false);

  if (visibleColumns.length === 0) {
    throw new Error('Table configuration must contain at least one visible Column.');
  }
};
