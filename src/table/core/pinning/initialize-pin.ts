import { pinLayout } from './pin-layout';

import type { PinCandidate, PinColumn, PinningViewport, PinResizeResult } from './types';

interface PreparedPin {
  readonly column: PinColumn;
  readonly sourceWidth: number;
}

const preparePin = (candidate: PinCandidate): PreparedPin => {
  const source = candidate.source;
  if (source.mode !== 'auto' && source.mode !== 'fixed')
    throw new Error(`Pin column "${candidate.id}" requires an auto or fixed width source.`);
  const sourceWidth = source.mode === 'auto' ? source.base : source.declaredWidth;
  if (!Number.isFinite(sourceWidth) || sourceWidth < 0)
    throw new RangeError(`Pin column "${candidate.id}" initial width must be finite and non-negative.`);

  const column: PinColumn = {
    id: candidate.id,
    side: candidate.side,
    width: candidate.minWidth ?? 0,
    ...(candidate.minWidth === undefined ? {} : { minWidth: candidate.minWidth }),
    ...(candidate.maxWidth === undefined ? {} : { maxWidth: candidate.maxWidth }),
  };

  return { column, sourceWidth };
};

const byId = (a: PinColumn, b: PinColumn): number => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);

export const initializePins = (
  columns: readonly PinColumn[],
  viewport: PinningViewport,
  candidates: readonly PinCandidate[],
): PinResizeResult => {
  pinLayout(columns, viewport);
  const prepared = candidates.map(preparePin);
  // Canonical summation makes allocated widths independent of declaration order.
  const minimumColumns = [...columns, ...prepared.map((pin) => pin.column)].toSorted(byId);
  const minimumLayout = pinLayout(minimumColumns, viewport);
  const canonical = prepared
    .toSorted((a, b) => byId(a.column, b.column))
    .map(({ column, sourceWidth }) => {
      const preferredWidth = Math.min(column.maxWidth ?? Infinity, Math.max(column.width, sourceWidth));
      return { column, preferredWidth, extra: preferredWidth - column.width };
    });
  const totalExtra = canonical.reduce((sum, pin) => sum + pin.extra, 0);
  const allocated = new Map<string, number>();

  if (totalExtra <= minimumLayout.remaining) {
    canonical.forEach(({ column, preferredWidth }) => allocated.set(column.id, preferredWidth));
  } else {
    const largest = canonical.reduce((max, pin) => Math.max(max, pin.extra), 0);
    const normalizedTotal = canonical.reduce((sum, pin) => sum + pin.extra / largest, 0);
    // Normalization avoids overflow when finite desired widths have an infinite sum.
    const alpha = Math.min(1, minimumLayout.remaining / largest / normalizedTotal);
    canonical.forEach(({ column, preferredWidth, extra }) => {
      // If alpha underflows, multiply the budget by the normalized share instead.
      const share = alpha > 0 ? extra * alpha : (minimumLayout.remaining * (extra / largest)) / normalizedTotal;
      const width = Math.min(preferredWidth, Math.max(column.width, column.width + share));
      allocated.set(column.id, width);
    });
  }

  const next = [...columns, ...prepared.map(({ column }) => ({ ...column, width: allocated.get(column.id)! }))];
  return { columns: next, layout: pinLayout(next, viewport) };
};

export const initializePin = (
  columns: readonly PinColumn[],
  viewport: PinningViewport,
  candidate: PinCandidate,
): PinResizeResult => initializePins(columns, viewport, [candidate]);
