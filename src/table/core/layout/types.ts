export interface GeometryColumn {
  id: string;
  mode: 'fixed' | 'auto';
  width: number;
  floor: number;
  max: number;
  manual?: number;
  resizable?: boolean;
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
