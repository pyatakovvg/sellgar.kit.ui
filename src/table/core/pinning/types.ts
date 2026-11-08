/** Sizes are logical numbers units, independent of CSS and pointer coordinates. */
export interface PinColumn {
  readonly id: string;
  readonly side: 'left' | 'right';
  readonly width: number;
  readonly minWidth?: number;
  readonly maxWidth?: number;
}

export interface PinningViewport {
  readonly width: number;
  readonly reserve: number;
}

export interface PinLayout {
  readonly leftWidth: number;
  readonly rightWidth: number;
  readonly totalWidth: number;
  readonly centerWidth: number;
  readonly budget: number;
  readonly remaining: number;
}

export interface PinResizeBounds {
  readonly min: number;
  readonly max: number;
}

export interface PinResizeResult {
  readonly columns: readonly PinColumn[];
  readonly layout: PinLayout;
}

export type PinWidthSource =
  { readonly mode: 'auto'; readonly base: number } | { readonly mode: 'fixed'; readonly declaredWidth: number };

export interface PinCandidate extends Omit<PinColumn, 'width'> {
  readonly source: PinWidthSource;
}
