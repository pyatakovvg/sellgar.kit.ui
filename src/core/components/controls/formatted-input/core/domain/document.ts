import { FormattedInputGroup } from './group';
import { FormattedInputLine } from './line';
import { FormattedInputSymbolConfig, FormattedInputSymbolNode } from './symbol';

export interface IFormattedInputDocumentOptions {
  id: string;
  lines?: readonly FormattedInputLine[];
}

export class FormattedInputDocument {
  readonly id: string;
  readonly lines: readonly FormattedInputLine[];

  constructor(options: IFormattedInputDocumentOptions) {
    this.id = options.id;
    this.lines = options.lines ?? [];
  }

  getSymbols(): readonly FormattedInputSymbolNode[] {
    return this.lines.flatMap((line) => line.getSymbols());
  }

  getRawValue(): string {
    return this.getSymbols()
      .map((node) => node.symbol.toRawText())
      .join('');
  }

  getDisplayValue(): string {
    return this.getSymbols()
      .map((node) => node.symbol.toDisplayText())
      .join('');
  }
}

export const createFormattedInputIdentityDocument = (rawValue: string): FormattedInputDocument => {
  const lineId = 'line:0';
  const groupId = 'group:0';
  const symbols = Array.from(rawValue, (char, index) => {
    const symbol = new FormattedInputSymbolConfig({
      id: `symbol:${index}`,
      char,
    });

    return new FormattedInputSymbolNode({
      symbol,
      lineId,
      groupId,
      ordinal: index,
      rawOffset: index,
      visualOffset: index,
    });
  });
  const group = new FormattedInputGroup({
    id: groupId,
    symbols,
  });
  const line = new FormattedInputLine({
    id: lineId,
    groups: [group],
  });

  return new FormattedInputDocument({
    id: 'document:0',
    lines: [line],
  });
};
