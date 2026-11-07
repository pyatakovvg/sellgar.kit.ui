export interface GeometryColumn {
  id: string;
  mode: 'fixed' | 'auto';
  width: number;
  floor: number;
  max: number;
  manual?: number;
  resizable?: boolean;
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
