import { EMPTY_FORMATTED_INPUT_STYLE, mergeFormattedInputStyle } from './style';

import type { IFormattedInputStyleConfig } from './style';

export type TFormattedInputSymbolRole = 'editable' | 'literal' | 'separator' | 'placeholder';
export type TFormattedInputSymbolHitMode = 'text' | 'cell';

export interface IFormattedInputSymbolConfigOptions {
  id: string;
  char: string;
  role?: TFormattedInputSymbolRole;
  hitMode?: TFormattedInputSymbolHitMode;
  editable?: boolean;
  removable?: boolean;
  raw?: boolean;
  style?: IFormattedInputStyleConfig;
}

export class FormattedInputSymbolConfig {
  readonly id: string;
  readonly char: string;
  readonly role: TFormattedInputSymbolRole;
  readonly hitMode: TFormattedInputSymbolHitMode;
  readonly editable: boolean;
  readonly removable: boolean;
  readonly raw: boolean;
  readonly style: IFormattedInputStyleConfig;

  constructor(options: IFormattedInputSymbolConfigOptions) {
    const role = options.role ?? 'editable';

    this.id = options.id;
    this.char = options.char;
    this.role = role;
    this.hitMode = options.hitMode ?? 'text';
    this.editable = options.editable ?? role === 'editable';
    this.removable = options.removable ?? role === 'editable';
    this.raw = options.raw ?? (role !== 'separator' && role !== 'placeholder');
    this.style = options.style ?? EMPTY_FORMATTED_INPUT_STYLE;
  }

  withChar(char: string): FormattedInputSymbolConfig {
    return new FormattedInputSymbolConfig({
      id: this.id,
      char,
      role: this.role,
      hitMode: this.hitMode,
      editable: this.editable,
      removable: this.removable,
      raw: this.raw,
      style: this.style,
    });
  }

  withStyle(style: IFormattedInputStyleConfig): FormattedInputSymbolConfig {
    return new FormattedInputSymbolConfig({
      id: this.id,
      char: this.char,
      role: this.role,
      hitMode: this.hitMode,
      editable: this.editable,
      removable: this.removable,
      raw: this.raw,
      style: mergeFormattedInputStyle(this.style, style),
    });
  }

  toRawText(): string {
    if (!this.raw) {
      return '';
    }

    return this.char;
  }

  toDisplayText(): string {
    return this.char;
  }
}

export interface IFormattedInputSymbolNodeOptions {
  symbol: FormattedInputSymbolConfig;
  lineId: string;
  groupId: string;
  ordinal: number;
  rawOffset: number | null;
  visualOffset: number;
}

export class FormattedInputSymbolNode {
  readonly symbol: FormattedInputSymbolConfig;
  readonly lineId: string;
  readonly groupId: string;
  readonly ordinal: number;
  readonly rawOffset: number | null;
  readonly visualOffset: number;

  constructor(options: IFormattedInputSymbolNodeOptions) {
    this.symbol = options.symbol;
    this.lineId = options.lineId;
    this.groupId = options.groupId;
    this.ordinal = options.ordinal;
    this.rawOffset = options.rawOffset;
    this.visualOffset = options.visualOffset;
  }
}
