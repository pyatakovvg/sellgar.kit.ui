export type TFormattedInputCaretAffinity = 'before' | 'after';

export interface IFormattedInputPositionOptions {
  lineIndex?: number;
  groupIndex?: number;
  symbolIndex?: number;
  rawOffset: number;
  visualOffset?: number;
  affinity?: TFormattedInputCaretAffinity;
}

export class FormattedInputPosition {
  readonly lineIndex: number;
  readonly groupIndex: number;
  readonly symbolIndex: number;
  readonly rawOffset: number;
  readonly visualOffset: number;
  readonly affinity: TFormattedInputCaretAffinity;

  constructor(options: IFormattedInputPositionOptions) {
    this.lineIndex = options.lineIndex ?? 0;
    this.groupIndex = options.groupIndex ?? 0;
    this.symbolIndex = options.symbolIndex ?? options.rawOffset;
    this.rawOffset = options.rawOffset;
    this.visualOffset = options.visualOffset ?? options.rawOffset;
    this.affinity = options.affinity ?? 'after';
  }

  withRawOffset(rawOffset: number): FormattedInputPosition {
    return new FormattedInputPosition({
      lineIndex: this.lineIndex,
      groupIndex: this.groupIndex,
      symbolIndex: rawOffset,
      rawOffset,
      visualOffset: rawOffset,
      affinity: this.affinity,
    });
  }
}

export const clampFormattedInputOffset = (offset: number, rawValue: string): number => {
  if (offset < 0) {
    return 0;
  }

  if (offset > rawValue.length) {
    return rawValue.length;
  }

  return offset;
};
