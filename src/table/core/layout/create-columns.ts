import { clamp } from './column-layout';

import type { TableColumnDefinition } from '../column';
import type { GeometryColumn } from './types';

export const createGeometryColumns = (definitions: readonly TableColumnDefinition[]): GeometryColumn[] =>
  definitions
    .filter((column) => column.visible !== false)
    .toSorted((a, b) => (a.order ?? a.sourceIndex) - (b.order ?? b.sourceIndex))
    .map((column) => ({
      id: column.columnId,
      mode: typeof column.width === 'number' ? 'fixed' : 'auto',
      width:
        typeof column.width === 'number' ? clamp(column.width, column.minWidth ?? 0, column.maxWidth ?? Infinity) : 0,
      floor: column.minWidth ?? 0,
      max: column.maxWidth ?? Infinity,
      resizable: column.resizable === true,
    }));
