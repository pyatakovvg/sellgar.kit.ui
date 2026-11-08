import type { PinColumn, PinLayout, PinningViewport, PinResizeBounds, PinResizeResult } from './types';

export class PinBudgetError extends RangeError {}

const validateSize = (value: number, name: string): void => {
  if (!Number.isFinite(value) || value < 0) throw new RangeError(`${name} must be finite and non-negative.`);
};

export const pinLayout = (columns: readonly PinColumn[], viewport: PinningViewport): PinLayout => {
  validateSize(viewport.width, 'Pin viewport width');
  validateSize(viewport.reserve, 'Pin center reserve');
  if (viewport.reserve > viewport.width) throw new RangeError('Pin center reserve exceeds the viewport width.');

  const ids = new Set<string>();
  let leftWidth = 0;
  let rightWidth = 0;
  for (const column of columns) {
    if (ids.has(column.id)) throw new Error(`Duplicate pin column id "${column.id}".`);
    ids.add(column.id);
    if (column.side !== 'left' && column.side !== 'right')
      throw new Error(`Pin column "${column.id}" must specify the left or right side.`);

    const min = column.minWidth ?? 0;
    const max = column.maxWidth ?? Infinity;
    validateSize(min, `Pin column "${column.id}" minWidth`);
    if (max !== Infinity) validateSize(max, `Pin column "${column.id}" maxWidth`);
    if (min > max) throw new RangeError(`Pin column "${column.id}" minWidth exceeds maxWidth.`);
    validateSize(column.width, `Pin column "${column.id}" width`);
    if (column.width < min || column.width > max)
      throw new RangeError(`Pin column "${column.id}" width is outside its min/max bounds.`);

    if (column.side === 'left') leftWidth += column.width;
    else rightWidth += column.width;
  }

  const totalWidth = leftWidth + rightWidth;
  const budget = viewport.width - viewport.reserve;
  // Permit only accumulation error; preserve fractional widths without token rounding.
  const tolerance = Number.EPSILON * Math.max(viewport.width, totalWidth) * (columns.length + 2);
  if (!Number.isFinite(totalWidth) || totalWidth - budget > tolerance)
    throw new PinBudgetError('Pinned columns exceed the shared width budget.');

  return {
    leftWidth,
    rightWidth,
    totalWidth,
    centerWidth: Math.max(0, viewport.width - totalWidth),
    budget,
    remaining: Math.max(0, budget - totalWidth),
  };
};

const columnIndex = (columns: readonly PinColumn[], id: string): number => {
  const index = columns.findIndex((column) => column.id === id);
  if (index < 0) throw new Error(`Unknown pin column "${id}".`);
  return index;
};

const boundsFor = (columns: readonly PinColumn[], layout: PinLayout, index: number): PinResizeBounds => {
  const column = columns[index];
  const others = columns.reduce((sum, item, i) => sum + (i === index ? 0 : item.width), 0);
  return {
    min: column.minWidth ?? 0,
    // A valid current width remains reachable even at a floating-point budget boundary.
    max: Math.max(column.width, Math.min(column.maxWidth ?? Infinity, layout.budget - others)),
  };
};

export const pinResizeBounds = (
  columns: readonly PinColumn[],
  viewport: PinningViewport,
  id: string,
): PinResizeBounds => {
  const layout = pinLayout(columns, viewport);
  return boundsFor(columns, layout, columnIndex(columns, id));
};

export const resizePin = (
  columns: readonly PinColumn[],
  viewport: PinningViewport,
  id: string,
  targetWidth: number,
): PinResizeResult => {
  if (!Number.isFinite(targetWidth)) throw new RangeError('Pin resize target must be finite.');

  const layout = pinLayout(columns, viewport);
  const index = columnIndex(columns, id);
  const bounds = boundsFor(columns, layout, index);
  const width = Math.min(bounds.max, Math.max(bounds.min, targetWidth));
  const next = columns.map((column, i) => (i === index ? { ...column, width } : column));

  return { columns: next, layout: pinLayout(next, viewport) };
};
