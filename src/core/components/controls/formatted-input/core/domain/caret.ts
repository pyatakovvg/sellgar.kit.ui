import { EMPTY_FORMATTED_INPUT_STYLE, mergeFormattedInputStyle } from './style';

import type { FormattedInputPosition } from './position';
import type { IFormattedInputStyleConfig } from './style';

export interface IFormattedInputCaretOptions {
  position: FormattedInputPosition;
  style?: IFormattedInputStyleConfig;
}

export class FormattedInputCaret {
  readonly position: FormattedInputPosition;
  readonly style: IFormattedInputStyleConfig;

  constructor(options: IFormattedInputCaretOptions) {
    this.position = options.position;
    this.style = options.style ?? EMPTY_FORMATTED_INPUT_STYLE;
  }

  withPosition(position: FormattedInputPosition): FormattedInputCaret {
    return new FormattedInputCaret({
      position,
      style: this.style,
    });
  }

  withStyle(style: IFormattedInputStyleConfig): FormattedInputCaret {
    return new FormattedInputCaret({
      position: this.position,
      style: mergeFormattedInputStyle(this.style, style),
    });
  }
}
