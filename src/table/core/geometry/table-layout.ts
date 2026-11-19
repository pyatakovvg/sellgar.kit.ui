import { automatic, sharedLayout } from '../layout/column-layout';
import { pinLayout, pinResizeBounds } from '../pinning';

import type { GeometryColumn, LayoutAnchor } from '../layout/types';
import type { PinColumn, PinResizeBounds } from '../pinning';
import type { ColumnGeometry, ColumnRegion, ProjectedColumnGeometry, TableLayout, TableLayoutViewport } from './types';

/** Intersects pin budget with the center's capacity to fill the assigned surface. */
export const tablePinResizeBounds = (
  columns: readonly GeometryColumn[],
  pins: readonly PinColumn[],
  viewport: TableLayoutViewport,
  id: string,
): PinResizeBounds => {
  const bounds = pinResizeBounds(pins, viewport, id);
  const pinnedIds = new Set(pins.map((pin) => pin.id));
  const centerCapacity = columns.reduce(
    (sum, column) => sum + (pinnedIds.has(column.id) ? 0 : column.mode === 'fixed' ? column.width : column.max),
    0,
  );
  const others = pins.reduce((sum, pin) => sum + (pin.id === id ? 0 : pin.width), 0);
  return {
    min: Math.max(bounds.min, (viewport.surfaceWidth ?? viewport.width) - centerCapacity - others),
    max: bounds.max,
  };
};

/** Composes ready pin widths and ordinary state without initializing or resizing either. */
export const tableLayout = (
  columns: readonly GeometryColumn[],
  pins: readonly PinColumn[],
  viewport: TableLayoutViewport,
  anchor?: LayoutAnchor,
): TableLayout => {
  const indices = new Map<string, number>();
  columns.forEach((column, index) => {
    if (indices.has(column.id)) throw new Error(`Duplicate table geometry column id "${column.id}".`);
    indices.set(column.id, index);
  });
  for (const pin of pins) {
    if (!indices.has(pin.id)) throw new Error(`Unknown pin column "${pin.id}" in table geometry.`);
  }
  const orderedPins = pins.toSorted((a, b) => indices.get(a.id)! - indices.get(b.id)!);
  const pinned = pinLayout(orderedPins, viewport);
  const surfaceWidth = viewport.surfaceWidth ?? viewport.width;
  if (!Number.isFinite(surfaceWidth) || surfaceWidth < viewport.width)
    throw new RangeError('Table surface width must be finite and at least the visible viewport width.');

  const byId = new Map(pins.map((pin) => [pin.id, pin]));
  const centerColumns = columns.filter((column) => !byId.has(column.id));
  if (
    anchor &&
    (anchor.bases.length !== centerColumns.length ||
      !Number.isFinite(anchor.container) ||
      anchor.container < 0 ||
      anchor.bases.some((width) => !Number.isFinite(width) || width < 0))
  ) {
    throw new RangeError('Table layout anchor must describe the current center columns.');
  }

  const centerSurface = Math.max(0, surfaceWidth - pinned.totalWidth);
  const centerLayout =
    viewport.surfaceWidth === undefined
      ? automatic(centerColumns, pinned.centerWidth, anchor)
      : sharedLayout(centerColumns, centerSurface, pinned.centerWidth, anchor);
  const total = pinned.totalWidth + centerLayout.total;
  if (!Number.isFinite(total)) throw new RangeError('Table geometry total width must be finite.');

  const groups: Record<ColumnRegion, { id: string; sourceIndex: number; width: number }[]> = {
    left: [],
    center: [],
    right: [],
  };
  let centerIndex = 0;
  columns.forEach((column, sourceIndex) => {
    const pin = byId.get(column.id);
    const region = pin?.side ?? 'center';
    const width = pin ? pin.width : centerLayout.widths[centerIndex++];
    groups[region].push({ id: column.id, sourceIndex, width });
  });

  const geometry: ColumnGeometry[] = [];
  let offset = 0;
  for (const region of ['left', 'center', 'right'] as const) {
    let regionOffset = 0;
    for (const column of groups[region]) {
      geometry.push({ ...column, region, offset, regionOffset });
      offset += column.width;
      regionOffset += column.width;
    }
  }
  // A budget-boundary accumulation error must not invert or overlap clip regions.
  const leftEnd = Math.min(viewport.width, pinned.leftWidth);
  const rightStart = Math.max(leftEnd, viewport.width - pinned.rightWidth);

  return {
    columns: geometry,
    center: {
      columns: centerColumns,
      layout: centerLayout,
      availableWidth: pinned.centerWidth,
      surfaceWidth: centerSurface,
    },
    pins: pinned,
    regions: {
      left: { start: 0, end: leftEnd },
      center: { start: leftEnd, end: rightStart },
      right: { start: rightStart, end: viewport.width },
    },
    viewportWidth: viewport.width,
    total,
    overflow: Math.max(0, total - viewport.width),
    underfill: centerLayout.underfill,
  };
};

/** Projects an existing layout; scroll is local to the shared owner's visible viewport. */
export const projectColumns = (layout: TableLayout, scroll: number): ProjectedColumnGeometry[] => {
  if (!Number.isFinite(scroll)) throw new RangeError('Table projection scroll must be finite.');

  return layout.columns.map((column) => {
    const ordinaryOffset = column.offset - scroll;
    const displayOffset =
      column.region === 'left'
        ? column.regionOffset
        : column.region === 'right'
          ? layout.viewportWidth - layout.pins.rightWidth + column.regionOffset
          : ordinaryOffset;
    const shift = column.region === 'center' ? 0 : displayOffset - ordinaryOffset;
    if (!Number.isFinite(displayOffset) || !Number.isFinite(shift))
      throw new RangeError('Table projection offsets must be finite.');

    const region = layout.regions[column.region];
    const clipLeft = Math.min(column.width, Math.max(0, region.start - displayOffset));
    const visibleEnd = Math.min(column.width, Math.max(clipLeft, region.end - displayOffset));

    const pinInset =
      column.region === 'left'
        ? column.regionOffset
        : column.region === 'right'
          ? Math.max(0, layout.pins.rightWidth - column.regionOffset - column.width)
          : undefined;

    return { ...column, pinInset, displayOffset, shift, clipLeft, clipRight: column.width - visibleEnd };
  });
};
