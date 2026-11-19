import { clamp } from './column-layout';

import type { TableColumnDefinition } from '../column';
import type { GeometryColumn } from './types';

export const createGeometryColumns = (definitions: readonly TableColumnDefinition[]): GeometryColumn[] =>
  definitions
    .filter((column) => column.visible !== false)
    .toSorted((a, b) => (a.order ?? a.sourceIndex) - (b.order ?? b.sourceIndex))
    .map((column) => {
      const width =
        typeof column.width === 'number'
          ? clamp(column.width, column.minWidth ?? 0, column.maxWidth ?? Infinity)
          : undefined;

      return {
        id: column.columnId,
        mode: width === undefined ? 'auto' : 'fixed',
        width: width ?? 0,
        floor: column.minWidth ?? width ?? 0,
        max: column.maxWidth ?? Infinity,
        resizable: column.resizable === true,
        measureContent: width === undefined,
        ...(width === undefined && column.minWidth !== undefined ? { resizeFloor: column.minWidth } : {}),
        ...(column.pinLeft ? { pin: 'left' as const } : column.pinRight ? { pin: 'right' as const } : {}),
      };
    });
