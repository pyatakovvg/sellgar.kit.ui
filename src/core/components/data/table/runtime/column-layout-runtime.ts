import { assertTableInvariant } from './invariant.ts';

import type {
  TableColumnLayoutSnapshot,
  TableColumnModel,
  TableColumnWidth,
  TableColumnWidths,
  TableSortSnapshot,
} from './types.ts';

const createGridTemplateTrack = (width: TableColumnWidth | undefined): string => {
  if (typeof width === 'number') return `var(--numbers-${width})`;
  if (typeof width === 'string') return width;

  return 'minmax(max-content, auto)';
};

const getColumnOrder = (column: TableColumnModel, sourceIndex: number): number => {
  if (column.kind === 'selection') return Number.MIN_SAFE_INTEGER;
  if (column.kind === 'tree') return Number.MIN_SAFE_INTEGER + 1;

  return column.order ?? sourceIndex;
};

const getColumnPinWeight = (column: TableColumnModel): number => {
  if (column.pinLeft) return 1;
  if (column.pinRight) return 3;

  return 2;
};

const getColumnWidthPx = (column: TableColumnModel, columnWidths: TableColumnWidths): number | undefined => {
  const measuredWidth = columnWidths.get(column.columnId);

  if (measuredWidth !== undefined) return measuredWidth;
  if (typeof column.width === 'number') return column.width;

  return undefined;
};

const isDataColumnPinBoundaryCandidate = (layout: TableColumnLayoutSnapshot): boolean => layout.column.kind === 'data';

const applyPinLayout = <THeader, TActionContent>(
  layouts: TableColumnLayoutSnapshot<THeader, TActionContent>[],
  columnWidths: TableColumnWidths,
): TableColumnLayoutSnapshot<THeader, TActionContent>[] => {
  const nextLayouts = layouts.map((layout) => ({ ...layout }));
  const firstRightPinnedIndex = nextLayouts.findIndex(
    (layout) => layout.column.pinRight && isDataColumnPinBoundaryCandidate(layout),
  );
  let lastLeftPinnedIndex = -1;

  for (let index = 0; index < nextLayouts.length; index++) {
    const layout = nextLayouts[index];

    if (layout?.column.pinLeft && isDataColumnPinBoundaryCandidate(layout)) {
      lastLeftPinnedIndex = index;
    }
  }

  let leftOffset: number | null = 0;

  for (let index = 0; index < nextLayouts.length; index++) {
    const layout = nextLayouts[index];

    if (!layout?.column.pinLeft) continue;

    if (leftOffset !== null) {
      layout.pin = {
        side: 'left',
        offset: leftOffset,
        isBoundary: index === lastLeftPinnedIndex,
      };
    }

    const width = getColumnWidthPx(layout.column, columnWidths);
    leftOffset = width === undefined || leftOffset === null ? null : leftOffset + width;
  }

  let rightOffset: number | null = 0;

  for (let index = nextLayouts.length - 1; index >= 0; index--) {
    const layout = nextLayouts[index];

    if (!layout?.column.pinRight) continue;

    if (rightOffset !== null) {
      layout.pin = {
        side: 'right',
        offset: rightOffset,
        isBoundary: index === firstRightPinnedIndex,
      };
    }

    const width = getColumnWidthPx(layout.column, columnWidths);
    rightOffset = width === undefined || rightOffset === null ? null : rightOffset + width;
  }

  return nextLayouts;
};

export class ColumnLayoutRuntime<THeader = unknown, TActionContent = unknown> {
  createLayout(
    columns: TableColumnModel<THeader, TActionContent>[],
    sort: TableSortSnapshot = {},
    columnWidths: TableColumnWidths = new Map(),
  ): TableColumnLayoutSnapshot<THeader, TActionContent>[] {
    const layouts = columns
      .map((column, sourceIndex) => ({ column, sourceIndex }))
      .filter(({ column }) => column.visible !== false)
      .sort((left, right) => {
        const pinWeightDiff = getColumnPinWeight(left.column) - getColumnPinWeight(right.column);

        if (pinWeightDiff !== 0) return pinWeightDiff;

        const orderDiff =
          getColumnOrder(left.column, left.sourceIndex) - getColumnOrder(right.column, right.sourceIndex);

        if (orderDiff !== 0) return orderDiff;

        return left.sourceIndex - right.sourceIndex;
      })
      .map(({ column, sourceIndex }, visualIndex) => ({
        column,
        columnId: column.columnId,
        sourceIndex,
        visualIndex,
        gridTemplateTrack: createGridTemplateTrack(column.width),
        sort: {
          isSortable: Boolean(column.sort),
          isActive: sort.activeColumnId === column.columnId,
          direction: sort.activeColumnId === column.columnId ? sort.direction : undefined,
        },
      }));

    for (const layout of layouts) {
      assertTableInvariant(
        !layout.column.pinLeft || !layout.column.pinRight,
        `Table column id "${layout.column.columnId}" cannot be pinned left and right at the same time.`,
      );
    }

    return applyPinLayout(layouts, columnWidths);
  }

  createGridTemplateColumns(layouts: TableColumnLayoutSnapshot<THeader, TActionContent>[]): string {
    return layouts.map((layout) => layout.gridTemplateTrack).join(' ');
  }
}
