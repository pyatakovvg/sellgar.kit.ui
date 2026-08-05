import type { TFormattedInputDateTimeSegment } from '../datetime';
import type { TFormattedInputDateDraftSlot } from './date-draft';

export interface IFormattedInputTemporalSectionOptions {
  key: string;
  order: number;
  pattern: string;
  segment: TFormattedInputDateTimeSegment;
  slotIndexes: readonly number[];
}

const toInt = (value: string): number => Number.parseInt(value, 10);

const getDaysInMonth = (year: string, month: string): number => new Date(toInt(year), toInt(month), 0).getDate();

const joinSlots = (slots: readonly TFormattedInputDateDraftSlot[]): string => {
  let value = '';

  for (const slot of slots) {
    if (slot !== void 0) {
      value += slot;
    }
  }

  return value;
};

export class FormattedInputTemporalSection {
  readonly end: number;
  readonly key: string;
  readonly length: number;
  readonly order: number;
  readonly pattern: string;
  readonly segment: TFormattedInputDateTimeSegment;
  readonly slotIndexes: readonly number[];
  readonly start: number;

  constructor(options: IFormattedInputTemporalSectionOptions) {
    const firstSlotIndex = options.slotIndexes[0];
    const lastSlotIndex = options.slotIndexes[options.slotIndexes.length - 1];

    this.key = options.key;
    this.order = options.order;
    this.pattern = options.pattern;
    this.segment = options.segment;
    this.slotIndexes = options.slotIndexes;
    this.length = options.slotIndexes.length;
    this.start = firstSlotIndex ?? 0;
    this.end = lastSlotIndex === void 0 ? this.start : lastSlotIndex + 1;
  }

  containsOffset(rawOffset: number): boolean {
    return rawOffset >= this.start && rawOffset <= this.end;
  }

  validateComplete(value: string, parts: { day: string; month: string; year: string }): boolean {
    if (value.length !== this.length) {
      return false;
    }

    if (this.segment === 'day') {
      const day = toInt(value);

      if (day < 1 || day > 31) {
        return false;
      }

      if (parts.month.length === 2 && parts.year.length === 4) {
        return day <= getDaysInMonth(parts.year, parts.month);
      }

      return true;
    }

    if (this.segment === 'month') {
      const month = toInt(value);

      return month >= 1 && month <= 12;
    }

    if (this.segment === 'hour') {
      const hour = toInt(value);

      return hour >= 0 && hour <= 23;
    }

    if (this.segment === 'minute' || this.segment === 'second') {
      const timePart = toInt(value);

      return timePart >= 0 && timePart <= 59;
    }

    return true;
  }

  validatePartial(slots: readonly TFormattedInputDateDraftSlot[]): boolean {
    const firstSlot = slots[0];
    const secondSlot = slots[1];

    if (this.segment === 'day') {
      if (firstSlot !== void 0 && (firstSlot < '0' || firstSlot > '3')) {
        return false;
      }

      if (firstSlot !== void 0 && secondSlot !== void 0) {
        return this.validateComplete(`${firstSlot}${secondSlot}`, {
          day: `${firstSlot}${secondSlot}`,
          month: '',
          year: '',
        });
      }
    }

    if (this.segment === 'month') {
      if (firstSlot !== void 0 && firstSlot !== '0' && firstSlot !== '1') {
        return false;
      }

      if (firstSlot !== void 0 && secondSlot !== void 0) {
        return this.validateComplete(`${firstSlot}${secondSlot}`, {
          day: '',
          month: `${firstSlot}${secondSlot}`,
          year: '',
        });
      }
    }

    if (this.segment === 'hour') {
      if (firstSlot !== void 0 && firstSlot > '2') {
        return false;
      }

      if (firstSlot !== void 0 && secondSlot !== void 0) {
        return this.validateComplete(`${firstSlot}${secondSlot}`, {
          day: '',
          month: '',
          year: '',
        });
      }
    }

    if (this.segment === 'minute' || this.segment === 'second') {
      if (firstSlot !== void 0 && firstSlot > '5') {
        return false;
      }
    }

    return true;
  }

  getValue(slots: readonly TFormattedInputDateDraftSlot[]): string {
    const sectionSlots: TFormattedInputDateDraftSlot[] = [];

    for (const slotIndex of this.slotIndexes) {
      sectionSlots.push(slots[slotIndex]);
    }

    return joinSlots(sectionSlots);
  }
}
