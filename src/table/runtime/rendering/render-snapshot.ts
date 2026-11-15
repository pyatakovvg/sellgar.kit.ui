import type { TableColumnGeometry, TableRenderSnapshot, TableRowGeometry, TableSnapshot } from '../types';

const COLUMN_FIELDS = [
  'id',
  'index',
  'sourceIndex',
  'region',
  'width',
  'offset',
  'pinInset',
  'resizable',
  'resizeEdge',
  'left',
  'right',
  'measureContent',
  'compensator',
] as const;
const ROW_FIELDS = ['id', 'index', 'top', 'height', 'contentHeight', 'expanded', 'treeExpanded'] as const;

const sameColumn = (a: TableColumnGeometry, b: TableColumnGeometry): boolean =>
  COLUMN_FIELDS.every((field) => a[field] === b[field]) &&
  a.resizeBounds?.min === b.resizeBounds?.min &&
  a.resizeBounds?.max === b.resizeBounds?.max;

const sameRow = (a: TableRowGeometry, b: TableRowGeometry): boolean =>
  ROW_FIELDS.every((field) => a[field] === b[field]);

const retain = <T extends { readonly id: string }>(
  previous: readonly T[],
  current: readonly T[],
  equal: (a: T, b: T) => boolean,
): readonly T[] => {
  const byId = new Map(previous.map((item) => [item.id, item]));
  const next = current.map((item) => {
    const existing = byId.get(item.id);
    return existing && equal(existing, item) ? existing : item;
  });
  return previous.length === next.length && next.every((item, index) => item === previous[index]) ? previous : next;
};

/** React reads content membership and control state. Live scroll projections belong to the DOM adapter. */
export class RenderSnapshot {
  value: TableRenderSnapshot = { rows: [], columns: [], rowCount: 0, columnCount: 0, scale: 1 };

  update(state: TableSnapshot): void {
    const previous = this.value;
    const rows = retain(previous.rows, state.rows, sameRow);
    // displayOffset/shift/clipping change on scroll; React never applies these geometric properties.
    const columns = retain(previous.columns, state.columns, sameColumn);
    const scale = state.viewport.scale;
    const scaleY = state.viewport.scaleY;
    if (
      rows === previous.rows &&
      columns === previous.columns &&
      previous.rowCount === state.rowCount &&
      previous.columnCount === state.columnCount &&
      previous.error === state.error &&
      previous.scale === scale &&
      previous.scaleY === scaleY
    )
      return;
    this.value = {
      rows,
      columns,
      rowCount: state.rowCount,
      columnCount: state.columnCount,
      error: state.error,
      scale,
      scaleY,
    };
  }
}
