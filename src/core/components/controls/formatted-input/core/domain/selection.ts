import { FormattedInputCaret } from './caret';
import { FormattedInputPosition } from './position';

export type TFormattedInputSelectionDirection = 'forward' | 'backward' | 'none';

export interface IFormattedInputSelectionOptions {
  anchor: FormattedInputCaret;
  focus: FormattedInputCaret;
  direction?: TFormattedInputSelectionDirection;
}

export interface IFormattedInputRawRange {
  start: number;
  end: number;
}

export class FormattedInputSelection {
  readonly anchor: FormattedInputCaret;
  readonly focus: FormattedInputCaret;
  readonly direction: TFormattedInputSelectionDirection;

  constructor(options: IFormattedInputSelectionOptions) {
    this.anchor = options.anchor;
    this.focus = options.focus;
    this.direction = options.direction ?? 'none';
  }

  static collapsed(rawOffset: number): FormattedInputSelection {
    const position = new FormattedInputPosition({
      rawOffset,
    });
    const caret = new FormattedInputCaret({
      position,
    });

    return new FormattedInputSelection({
      anchor: caret,
      focus: caret,
      direction: 'none',
    });
  }

  isCollapsed(): boolean {
    return this.anchor.position.rawOffset === this.focus.position.rawOffset;
  }

  getRawRange(): IFormattedInputRawRange {
    const anchorOffset = this.anchor.position.rawOffset;
    const focusOffset = this.focus.position.rawOffset;

    return {
      start: Math.min(anchorOffset, focusOffset),
      end: Math.max(anchorOffset, focusOffset),
    };
  }
}
