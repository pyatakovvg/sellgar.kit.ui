import type { FormattedInputGroup } from './group';
import type { FormattedInputSymbolNode } from './symbol';

export interface IFormattedInputLineOptions {
  id: string;
  groups?: readonly FormattedInputGroup[];
}

export class FormattedInputLine {
  readonly id: string;
  readonly groups: readonly FormattedInputGroup[];

  constructor(options: IFormattedInputLineOptions) {
    this.id = options.id;
    this.groups = options.groups ?? [];
  }

  getSymbols(): readonly FormattedInputSymbolNode[] {
    return this.groups.flatMap((group) => group.symbols);
  }
}
