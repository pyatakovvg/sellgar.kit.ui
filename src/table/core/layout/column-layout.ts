import type { GeometryColumn, Layout, LayoutAnchor } from './types';

export const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

// Equal-share allocation retained from the geometry experiment; no public weight API.
export const distribute = (target: number, lows: number[], highs: number[]): number[] => {
  const minimum = lows.reduce((sum, value) => sum + value, 0);
  const maximum = highs.reduce((sum, value) => sum + value, 0);
  if (target <= minimum) return lows.slice();
  if (target >= maximum) return highs.slice();
  let left = 0;
  let right = Math.max(target, ...lows);
  for (let i = 0; i < 64; i++) {
    const middle = (left + right) / 2;
    const total = lows.reduce((sum, low, index) => sum + clamp(middle, low, highs[index]), 0);
    if (total < target) left = middle;
    else right = middle;
  }
  return lows.map((low, index) => clamp((left + right) / 2, low, highs[index]));
};

export const result = (columns: GeometryColumn[], container: number, base: number[], actual?: number[]): Layout => {
  const precise =
    actual ??
    columns.map((column, index) =>
      column.mode === 'fixed'
        ? column.width
        : clamp(Math.max(base[index], column.manual ?? 0), column.floor, column.max),
    );
  const widths = precise.map((width) => {
    const half = Math.round(width * 2) / 2;
    return Math.abs(width - half) < 1e-7 ? half : width;
  });
  const rounded = widths.reduce((sum, width) => sum + width, 0);
  if (rounded < container - 1e-7) {
    throw new RangeError('Column widths must fill the available container width.');
  }
  return {
    base,
    widths,
    total: rounded,
    overflow: Math.max(0, rounded - container),
    underfill: Math.max(0, container - rounded),
  };
};

export const automatic = (columns: GeometryColumn[], container: number, anchor?: LayoutAnchor): Layout => {
  const autos = columns.map((column, index) => (column.mode === 'auto' ? index : -1)).filter((index) => index >= 0);
  if (autos.length === 0) throw new Error('Table geometry must contain at least one automatic column.');
  const fixed = columns.reduce((sum, column) => sum + (column.mode === 'fixed' ? column.width : 0), 0);
  let target = container - fixed;
  if (anchor) {
    const prior = autos.reduce((sum, index) => sum + anchor.bases[index], 0);
    target = container < anchor.container ? prior + container - anchor.container : Math.max(prior, target);
  }
  const allocated = distribute(
    target,
    autos.map((i) => columns[i].floor),
    autos.map((i) => columns[i].max),
  );
  const base = columns.map((column) => column.width);
  autos.forEach((index, i) => {
    base[index] = allocated[i];
  });
  return result(columns, container, base);
};

export const resizeBounds = (
  columns: GeometryColumn[],
  layout: Layout,
  container: number,
  index: number,
): { min: number; max: number } => {
  const column = columns[index];
  if (column.mode === 'auto') return { min: layout.base[index], max: column.max };

  const rightGrowth = columns.reduce(
    (sum, item, i) => (i > index && item.mode === 'auto' ? sum + item.max - layout.widths[i] : sum),
    0,
  );
  const removableOverflow = Math.max(0, layout.total - container);
  return {
    min: Math.max(column.floor, layout.widths[index] - removableOverflow - rightGrowth),
    max: column.max,
  };
};

export const resizeDirections = (
  columns: GeometryColumn[],
  layout: Layout,
  container: number,
  index: number,
): { left: boolean; right: boolean } => {
  if (columns[index].resizable !== true || index === columns.length - 1) return { left: false, right: false };
  const bounds = resizeBounds(columns, layout, container, index);
  return {
    left: layout.widths[index] > bounds.min + 1e-7,
    right: layout.widths[index] < bounds.max - 1e-7,
  };
};

const resizeMutable = (
  columns: GeometryColumn[],
  layout: Layout,
  container: number,
  index: number,
  target: number,
): Layout => {
  const column = columns[index];
  const widths = layout.widths.slice();
  const base = layout.base.slice();
  const bounds = resizeBounds(columns, layout, container, index);
  if (column.mode === 'auto') {
    const width = clamp(target, bounds.min, bounds.max);
    if (Math.abs(width - base[index]) < 1e-7) delete column.manual;
    else column.manual = width;
    widths[index] = width;
    return result(columns, container, base, widths);
  }
  const right = columns.map((item, i) => (i > index && item.mode === 'auto' ? i : -1)).filter((i) => i >= 0);
  const width = clamp(target, bounds.min, bounds.max);
  const delta = width - widths[index];
  column.width = width;
  widths[index] = width;
  const before = right.reduce((sum, i) => sum + widths[i], 0);
  const needed = delta >= 0 ? before - delta : before + Math.max(0, container - layout.total - delta);
  const allocation = distribute(
    needed,
    right.map((i) => Math.max(columns[i].floor, columns[i].manual ?? 0)),
    right.map((i) => columns[i].max),
  );
  const baseBefore = right.reduce((sum, i) => sum + layout.base[i], 0);
  const baseTotal = columns.reduce(
    (sum, item, i) => sum + (item.mode === 'fixed' ? layout.widths[i] : layout.base[i]),
    0,
  );
  const baseNeeded = delta >= 0 ? baseBefore - delta : baseBefore + Math.max(0, container - baseTotal - delta);
  const baseAllocation = distribute(
    baseNeeded,
    right.map((i) => columns[i].floor),
    right.map((i) => columns[i].max),
  );
  right.forEach((i, offset) => {
    widths[i] = allocation[offset];
    base[i] = baseAllocation[offset];
  });
  base[index] = width;
  return result(columns, container, base, widths);
};

export const resize = (
  columns: GeometryColumn[],
  layout: Layout,
  container: number,
  index: number,
  target: number,
): { columns: GeometryColumn[]; layout: Layout } => {
  const next = columns.map((column) => ({ ...column }));
  return { columns: next, layout: resizeMutable(next, layout, container, index, target) };
};
