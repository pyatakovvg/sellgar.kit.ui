import { EMPTY_FORMATTED_INPUT_STYLE } from './style';

import type { FormattedInputSymbolNode } from './symbol';
import type { IFormattedInputStyleConfig } from './style';

export type TFormattedInputGroupRole = 'editable' | 'literal' | 'separator' | 'segment';

export interface IFormattedInputGroupOptions {
  id: string;
  role?: TFormattedInputGroupRole;
  symbols?: readonly FormattedInputSymbolNode[];
  style?: IFormattedInputStyleConfig;
}

export class FormattedInputGroup {
  readonly id: string;
  readonly role: TFormattedInputGroupRole;
  readonly symbols: readonly FormattedInputSymbolNode[];
  readonly style: IFormattedInputStyleConfig;

  constructor(options: IFormattedInputGroupOptions) {
    this.id = options.id;
    this.role = options.role ?? 'editable';
    this.symbols = options.symbols ?? [];
    this.style = options.style ?? EMPTY_FORMATTED_INPUT_STYLE;
  }
}
