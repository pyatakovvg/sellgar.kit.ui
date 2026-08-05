import type { IFormattedInputMaskSlotRule, TFormattedInputMaskToken } from './mask-config';

export type TFormattedInputMaskSlotValue = string | undefined;

export interface IFormattedInputMaskRawToken {
  readonly rawIndex: number;
  readonly slotIndex: number | null;
  readonly token: Exclude<TFormattedInputMaskToken, { type: 'separator' }>;
}

export class FormattedInputMaskDraft {
  readonly rawTokens: readonly IFormattedInputMaskRawToken[];
  readonly slotCapacity: number;
  readonly slotValues: readonly TFormattedInputMaskSlotValue[];

  constructor(options: {
    rawTokens: readonly IFormattedInputMaskRawToken[];
    slotCapacity: number;
    slotValues: readonly TFormattedInputMaskSlotValue[];
  }) {
    this.rawTokens = options.rawTokens;
    this.slotCapacity = options.slotCapacity;
    this.slotValues = options.slotValues.slice(0, options.slotCapacity);
  }

  static createRawTokens(tokens: readonly TFormattedInputMaskToken[]): readonly IFormattedInputMaskRawToken[] {
    const rawTokens: IFormattedInputMaskRawToken[] = [];
    let rawIndex = 0;
    let slotIndex = 0;

    for (const token of tokens) {
      if (token.type === 'separator') {
        continue;
      }

      rawTokens.push({
        token,
        rawIndex,
        slotIndex: token.type === 'slot' ? slotIndex : null,
      });

      if (token.type === 'slot') {
        slotIndex++;
      }

      rawIndex++;
    }

    return rawTokens;
  }

  static fromRawValue(
    rawTokens: readonly IFormattedInputMaskRawToken[],
    slotCapacity: number,
    rawValue: string,
  ): FormattedInputMaskDraft {
    const slotValues: string[] = [];
    let rawIndex = 0;

    for (const rawToken of rawTokens) {
      if (slotValues.length >= slotCapacity) {
        break;
      }

      if (rawToken.token.type === 'literal') {
        if (rawValue[rawIndex] === rawToken.token.char) {
          rawIndex++;
        }

        continue;
      }

      const char = findNextAcceptedChar(rawValue, rawIndex, rawToken.token.rule);

      if (char === null) {
        break;
      }

      slotValues.push(char.value);
      rawIndex = char.nextIndex;
    }

    return new FormattedInputMaskDraft({
      rawTokens,
      slotCapacity,
      slotValues,
    });
  }

  getSlotValues(): readonly TFormattedInputMaskSlotValue[] {
    return this.slotValues;
  }

  removeSlots(startSlotIndex: number, endSlotIndex: number): FormattedInputMaskDraft {
    return this.replaceSlots(startSlotIndex, endSlotIndex, []);
  }

  replaceSlots(
    startSlotIndex: number,
    endSlotIndex: number,
    insertValues: readonly string[],
  ): FormattedInputMaskDraft {
    const normalizedStart = normalizeSlotIndex(startSlotIndex, this.slotCapacity);
    const normalizedEnd = Math.max(normalizedStart, normalizeSlotIndex(endSlotIndex, this.slotCapacity));
    const currentSlotValues = this._createSlotValueBuffer();
    const slotValues = [
      ...currentSlotValues.slice(0, normalizedStart),
      ...insertValues,
      ...currentSlotValues.slice(normalizedEnd),
    ].slice(0, this.slotCapacity);

    return new FormattedInputMaskDraft({
      rawTokens: this.rawTokens,
      slotCapacity: this.slotCapacity,
      slotValues,
    });
  }

  toRawValue(): string {
    if (!this._hasSlotValue()) {
      return '';
    }

    const chars: string[] = [];
    let slotIndex = 0;

    for (const rawToken of this.rawTokens) {
      if (rawToken.token.type === 'literal') {
        chars.push(rawToken.token.char);
        continue;
      }

      const value = this.slotValues[slotIndex];

      if (value === void 0) {
        slotIndex++;
        continue;
      }

      chars.push(value);
      slotIndex++;
    }

    return chars.join('');
  }

  private _createSlotValueBuffer(): TFormattedInputMaskSlotValue[] {
    const slotValues: TFormattedInputMaskSlotValue[] = Array.from({ length: this.slotCapacity });

    for (let index = 0; index < this.slotValues.length && index < this.slotCapacity; index++) {
      slotValues[index] = this.slotValues[index];
    }

    return slotValues;
  }

  private _hasSlotValue(): boolean {
    for (const value of this.slotValues) {
      if (value !== void 0) {
        return true;
      }
    }

    return false;
  }
}

export const findNextAcceptedChar = (
  value: string,
  startIndex: number,
  rule: IFormattedInputMaskSlotRule,
): { nextIndex: number; value: string } | null => {
  for (let index = startIndex; index < value.length; index++) {
    const char = value[index];

    if (rule.accepts(char)) {
      return {
        value: char,
        nextIndex: index + 1,
      };
    }
  }

  return null;
};

const normalizeSlotIndex = (slotIndex: number, slotCapacity: number): number => {
  if (slotIndex < 0) {
    return 0;
  }

  if (slotIndex > slotCapacity) {
    return slotCapacity;
  }

  return slotIndex;
};
