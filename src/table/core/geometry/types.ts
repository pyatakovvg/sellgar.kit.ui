import type { GeometryColumn, Layout } from '../layout/types';
import type { PinLayout, PinningViewport } from '../pinning';

export interface TableLayoutViewport extends PinningViewport {
  /** Assigned shared surface; defaults to the visible viewport width. */
  readonly surfaceWidth?: number;
}

export type ColumnRegion = 'left' | 'center' | 'right';

export interface HorizontalRegion {
  readonly start: number;
  readonly end: number;
}

export interface ColumnGeometry {
  readonly id: string;
  readonly sourceIndex: number;
  readonly region: ColumnRegion;
  readonly width: number;
  readonly offset: number;
  readonly regionOffset: number;
}

export interface TableLayout {
  readonly columns: readonly ColumnGeometry[];
  readonly center: {
    readonly columns: readonly GeometryColumn[];
    readonly layout: Layout;
    readonly availableWidth: number;
    readonly surfaceWidth: number;
  };
  readonly pins: PinLayout;
  readonly regions: Readonly<Record<ColumnRegion, HorizontalRegion>>;
  readonly viewportWidth: number;
  readonly total: number;
  /** Content overflow relative to the visible viewport, including a shared surface. */
  readonly overflow: number;
  /** Unfilled assigned surface, following the existing ordinary layout tolerance. */
  readonly underfill: number;
}

export interface ProjectedColumnGeometry extends ColumnGeometry {
  /** Stable inset from the pinned edge; independent of horizontal scroll. */
  readonly pinInset?: number;
  readonly displayOffset: number;
  readonly shift: number;
  readonly clipLeft: number;
  readonly clipRight: number;
}
