export interface GeometryColumn {
  id: string;
  mode: 'fixed' | 'auto';
  width: number;
  floor: number;
  /** Explicit lower bound for manual resize, independent of measured content. */
  resizeFloor?: number;
  max: number;
  manual?: number;
  resizable?: boolean;
  /** Use measured content as a floor together with the declared min/max bounds. */
  measureContent?: boolean;
  /** Internal trailing space; ordinary automatic columns receive space first. */
  compensator?: boolean;
  /** Declaration metadata; ordinary layout math does not interpret pinning. */
  pin?: 'left' | 'right';
}

export interface Layout {
  base: number[];
  widths: number[];
  total: number;
  overflow: number;
  underfill: number;
}

export interface LayoutAnchor {
  container: number;
  bases: number[];
}
