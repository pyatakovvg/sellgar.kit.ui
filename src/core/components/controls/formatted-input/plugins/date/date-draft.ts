import type { IFormattedInputDateTimeParts } from '../datetime';
import type { FormattedInputTemporalSection } from './temporal-section';

export type TFormattedInputDateDraftSlot = string | undefined;

const createSectionValue = (parts: IFormattedInputDateTimeParts, section: FormattedInputTemporalSection): string => {
  const value = parts[section.segment];

  if (section.pattern === 'YY') {
    return value.slice(-2);
  }

  return value.slice(0, section.length);
};

export class FormattedInputDateDraft {
  readonly baseParts: IFormattedInputDateTimeParts;
  readonly slots: readonly TFormattedInputDateDraftSlot[];

  constructor(options: { baseParts: IFormattedInputDateTimeParts; slots: readonly TFormattedInputDateDraftSlot[] }) {
    this.baseParts = options.baseParts;
    this.slots = options.slots;
  }

  static createEmpty(baseParts: IFormattedInputDateTimeParts, slotCount: number): FormattedInputDateDraft {
    return new FormattedInputDateDraft({
      baseParts,
      slots: new Array<TFormattedInputDateDraftSlot>(slotCount).fill(void 0),
    });
  }

  static createFromParts(
    baseParts: IFormattedInputDateTimeParts,
    sections: readonly FormattedInputTemporalSection[],
    slotCount: number,
  ): FormattedInputDateDraft {
    const slots = new Array<TFormattedInputDateDraftSlot>(slotCount).fill(void 0);

    for (const section of sections) {
      const value = createSectionValue(baseParts, section);

      for (let index = 0; index < section.slotIndexes.length; index++) {
        const slotIndex = section.slotIndexes[index];

        slots[slotIndex] = value[index];
      }
    }

    return new FormattedInputDateDraft({
      baseParts,
      slots,
    });
  }

  clearSlots(slotIndexes: readonly number[]): FormattedInputDateDraft {
    const slots = [...this.slots];

    for (const slotIndex of slotIndexes) {
      if (slotIndex >= 0 && slotIndex < slots.length) {
        slots[slotIndex] = void 0;
      }
    }

    return new FormattedInputDateDraft({
      baseParts: this.baseParts,
      slots,
    });
  }

  equals(draft: FormattedInputDateDraft): boolean {
    if (draft.slots.length !== this.slots.length) {
      return false;
    }

    for (let index = 0; index < this.slots.length; index++) {
      if (this.slots[index] !== draft.slots[index]) {
        return false;
      }
    }

    return true;
  }

  getSectionValue(section: FormattedInputTemporalSection): string {
    let value = '';

    for (const slotIndex of section.slotIndexes) {
      const slot = this.slots[slotIndex];

      if (slot !== void 0) {
        value += slot;
      }
    }

    return value;
  }

  getSlot(slotIndex: number): TFormattedInputDateDraftSlot {
    return this.slots[slotIndex];
  }

  setSlot(slotIndex: number, value: TFormattedInputDateDraftSlot): FormattedInputDateDraft {
    if (slotIndex < 0 || slotIndex >= this.slots.length) {
      return this;
    }

    const slots = [...this.slots];

    slots[slotIndex] = value;

    return new FormattedInputDateDraft({
      baseParts: this.baseParts,
      slots,
    });
  }

  isComplete(): boolean {
    for (const slot of this.slots) {
      if (slot === void 0) {
        return false;
      }
    }

    return true;
  }

  isEmpty(): boolean {
    for (const slot of this.slots) {
      if (slot !== void 0) {
        return false;
      }
    }

    return true;
  }

  toCompactValue(): string {
    let value = '';

    for (const slot of this.slots) {
      if (slot !== void 0) {
        value += slot;
      }
    }

    return value;
  }

  replaceRange(start: number, end: number, text: string): FormattedInputDateDraft {
    const slots = [...this.slots];
    const normalizedStart = this._normalizeOffset(start);
    const normalizedEnd = this._createReplacementEnd(normalizedStart, end, text);

    for (let index = normalizedStart; index < normalizedEnd; index++) {
      slots[index] = void 0;
    }

    for (let index = 0; index < text.length && normalizedStart + index < slots.length; index++) {
      slots[normalizedStart + index] = text[index];
    }

    return new FormattedInputDateDraft({
      baseParts: this.baseParts,
      slots,
    });
  }

  toParts(sections: readonly FormattedInputTemporalSection[]): IFormattedInputDateTimeParts {
    const parts: Record<keyof IFormattedInputDateTimeParts, string> = {
      day: this.baseParts.day,
      fraction: this.baseParts.fraction,
      hour: this.baseParts.hour,
      minute: this.baseParts.minute,
      month: this.baseParts.month,
      offset: this.baseParts.offset,
      second: this.baseParts.second,
      year: this.baseParts.year,
    };

    for (const section of sections) {
      const value = this.getSectionValue(section);

      if (section.pattern === 'YY') {
        parts.year = `${this.baseParts.year.slice(0, 2)}${value}`;
        continue;
      }

      parts[section.segment] = value;
    }

    return parts;
  }

  private _createReplacementEnd(start: number, end: number, text: string): number {
    const normalizedEnd = Math.max(start, this._normalizeOffset(end));

    if (start === normalizedEnd && text.length > 0) {
      return this._normalizeOffset(start + text.length);
    }

    return normalizedEnd;
  }

  private _normalizeOffset(offset: number): number {
    if (offset < 0) {
      return 0;
    }

    if (offset > this.slots.length) {
      return this.slots.length;
    }

    return offset;
  }
}
