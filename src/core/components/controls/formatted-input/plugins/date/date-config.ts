import cn from 'classnames';

import {
  FormattedInputDateTimeFormatCompiler,
  createFormattedInputDateTimeDefaults,
  createFormattedInputDateTimeParts,
  formatFormattedInputIsoDateTime,
  parseFormattedInputIsoDateTime,
} from '../datetime';
import { FormattedInputDateDraft } from './date-draft';
import { FormattedInputTemporalSection } from './temporal-section';

import type {
  IFormattedInputDateTimeDefaults,
  IFormattedInputDateTimeParts,
  IFormattedInputDateTimePattern,
  IFormattedInputDateTimeSeparatorToken,
  IFormattedInputDateTimeSlotToken,
  TFormattedInputDateTimeSegment,
  TFormattedInputDateDisplayTokenOptions,
} from '../datetime';

export interface IFormattedInputTemporalSymbolClassNames {
  emptySlot?: string;
  filledSlot?: string;
  invalidSection?: string;
  section?: string;
  separator?: string;
  slot?: string;
}

export interface IFormattedInputDateConfigOptions {
  defaultFraction?: string;
  defaultHour?: string;
  defaultMinute?: string;
  defaultOffset?: string;
  defaultSecond?: string;
  displayFormat?: readonly TFormattedInputDateDisplayTokenOptions[];
  name?: string;
  outputFormat?: string;
  placeholder?: string;
  priority?: number;
  slotPlaceholder?: string;
  symbolClassNames?: IFormattedInputTemporalSymbolClassNames;
}

const DEFAULT_DISPLAY_FORMAT: readonly TFormattedInputDateDisplayTokenOptions[] = [
  {
    type: 'slot',
    pattern: 'DD',
  },
  {
    type: 'separator',
    char: '.',
  },
  {
    type: 'slot',
    pattern: 'MM',
  },
  {
    type: 'separator',
    char: '.',
  },
  {
    type: 'slot',
    pattern: 'YYYY',
  },
];
const DEFAULT_OUTPUT_FORMAT = "YYYY-MM-DD'T'HH:mm:ssXXX";
const DEFAULT_SLOT_PLACEHOLDER = '_';
const DIGIT_PATTERN = /\d/g;

const isDigit = (char: string): boolean => char >= '0' && char <= '9';

const padDatePart = (value: number): string => String(value).padStart(2, '0');

export class FormattedInputDateConfig {
  readonly defaults: IFormattedInputDateTimeDefaults;
  readonly displayFormat: readonly TFormattedInputDateDisplayTokenOptions[];
  readonly name: string;
  readonly outputFormat: string;
  readonly pattern: IFormattedInputDateTimePattern;
  readonly priority?: number;
  readonly sections: readonly FormattedInputTemporalSection[];
  readonly slotPlaceholder: string;
  readonly symbolClassNames: IFormattedInputTemporalSymbolClassNames;
  private readonly _compiler = new FormattedInputDateTimeFormatCompiler();

  constructor(options: IFormattedInputDateConfigOptions = {}) {
    this.defaults = createFormattedInputDateTimeDefaults({
      fraction: options.defaultFraction,
      hour: options.defaultHour,
      minute: options.defaultMinute,
      offset: options.defaultOffset,
      second: options.defaultSecond,
    });
    this.displayFormat = options.displayFormat ?? DEFAULT_DISPLAY_FORMAT;
    this.name = options.name ?? 'date';
    this.outputFormat = options.outputFormat ?? DEFAULT_OUTPUT_FORMAT;
    this.pattern = this._compiler.compile(this.displayFormat);
    this.priority = options.priority;
    this.sections = this._createSections();
    this.slotPlaceholder = options.slotPlaceholder ?? options.placeholder ?? DEFAULT_SLOT_PLACEHOLDER;
    this.symbolClassNames = options.symbolClassNames ?? {};
  }

  clearSection(draft: FormattedInputDateDraft, slotIndex: number): FormattedInputDateDraft {
    const section = this.getSectionForRawOffset(slotIndex);

    if (section === null) {
      return draft;
    }

    return draft.clearSlots(section.slotIndexes);
  }

  createDraft(value: string): FormattedInputDateDraft {
    const parts = this._createBaseParts(value);

    if (value.length === 0) {
      return FormattedInputDateDraft.createEmpty(parts, this.pattern.slotCount);
    }

    return FormattedInputDateDraft.createFromParts(parts, this.sections, this.pattern.slotCount);
  }

  createIsoValueFromDraft(draft: FormattedInputDateDraft): string {
    return formatFormattedInputIsoDateTime(draft.toParts(this.sections), this.outputFormat);
  }

  getAdjacentSection(visualOffset: number, direction: 'left' | 'right'): FormattedInputTemporalSection | null {
    const currentSection = this.getSectionForVisualOffset(visualOffset);

    if (currentSection === null) {
      return direction === 'left' ? (this.sections[this.sections.length - 1] ?? null) : (this.sections[0] ?? null);
    }

    const nextOrder = direction === 'left' ? currentSection.order - 1 : currentSection.order + 1;

    return this.sections[nextOrder] ?? null;
  }

  getSectionForRawOffset(rawOffset: number): FormattedInputTemporalSection | null {
    const normalizedRawOffset = this.normalizeRawOffset(rawOffset);

    for (const section of this.sections) {
      if (section.start === normalizedRawOffset) {
        return section;
      }
    }

    for (const section of this.sections) {
      if (section.containsOffset(normalizedRawOffset)) {
        return section;
      }
    }

    return null;
  }

  getSectionForSlot(slotIndex: number): FormattedInputTemporalSection | null {
    for (const section of this.sections) {
      if (section.slotIndexes.includes(slotIndex)) {
        return section;
      }
    }

    return null;
  }

  getSectionForVisualOffset(visualOffset: number): FormattedInputTemporalSection | null {
    if (visualOffset < 0) {
      return this.sections[0] ?? null;
    }

    const token = this.pattern.tokens[visualOffset];

    if (token?.type === 'slot') {
      return this.getSectionForSlot(token.slotIndex);
    }

    for (let tokenIndex = Math.min(visualOffset - 1, this.pattern.tokens.length - 1); tokenIndex >= 0; tokenIndex--) {
      const token = this.pattern.tokens[tokenIndex];

      if (token.type === 'slot') {
        return this.getSectionForSlot(token.slotIndex);
      }
    }

    return this.sections[0] ?? null;
  }

  getSeparatorClassName(token: IFormattedInputDateTimeSeparatorToken): string | undefined {
    return cn(this.symbolClassNames.separator, token.className) || void 0;
  }

  getSlotClassName(token: IFormattedInputDateTimeSlotToken, isFilled: boolean): string | undefined {
    const classNames = [
      this.symbolClassNames.slot,
      token.className,
      isFilled ? this.symbolClassNames.filledSlot : this.symbolClassNames.emptySlot,
      isFilled ? token.valueClassName : token.placeholderClassName,
    ];

    return cn(classNames) || void 0;
  }

  isDraftAllowed(draft: FormattedInputDateDraft): boolean {
    const parts = draft.toParts(this.sections);

    for (const section of this.sections) {
      const sectionSlots = section.slotIndexes.map((slotIndex) => draft.getSlot(slotIndex));

      if (!section.validatePartial(sectionSlots)) {
        return false;
      }

      const value = section.getValue(draft.slots);

      if (value.length === section.length && !section.validateComplete(value, parts)) {
        return false;
      }
    }

    return true;
  }

  normalizeInsertValue(value: string): string {
    return this._extractDigits(value).join('').slice(0, this.pattern.slotCount);
  }

  normalizePasteValue(value: string): string {
    const parts = parseFormattedInputIsoDateTime(value.trim(), this.defaults);

    if (parts !== null) {
      return this._createDraftValueFromParts(parts);
    }

    return this.normalizeInsertValue(value);
  }

  normalizeRawOffset(rawOffset: number): number {
    if (rawOffset < 0) {
      return 0;
    }

    if (rawOffset > this.pattern.slotCount) {
      return this.pattern.slotCount;
    }

    return rawOffset;
  }

  private _createBaseParts(value: string): IFormattedInputDateTimeParts {
    const parts = parseFormattedInputIsoDateTime(value, this.defaults);

    if (parts !== null) {
      return parts;
    }

    return this._createCurrentDateParts();
  }

  private _createCurrentDateParts(): IFormattedInputDateTimeParts {
    const date = new Date();

    return createFormattedInputDateTimeParts(
      {
        day: padDatePart(date.getDate()),
        month: padDatePart(date.getMonth() + 1),
        year: String(date.getFullYear()),
      },
      this.defaults,
    );
  }

  private _createDraftValueFromParts(parts: IFormattedInputDateTimeParts): string {
    let result = '';

    for (const section of this.sections) {
      const value = section.pattern === 'YY' ? parts.year.slice(-2) : parts[section.segment];

      result += value.slice(0, section.length);
    }

    return result.slice(0, this.pattern.slotCount);
  }

  private _createSections(): readonly FormattedInputTemporalSection[] {
    const sections: FormattedInputTemporalSection[] = [];
    let currentSegment: TFormattedInputDateTimeSegment | null = null;
    let currentPattern = '';
    let currentSlotIndexes: number[] = [];

    const pushSection = (): void => {
      if (currentSegment === null || currentSlotIndexes.length === 0) {
        return;
      }

      sections.push(
        new FormattedInputTemporalSection({
          key: `${currentPattern}#${sections.length}`,
          order: sections.length,
          pattern: currentPattern,
          segment: currentSegment,
          slotIndexes: currentSlotIndexes,
        }),
      );
      currentSegment = null;
      currentPattern = '';
      currentSlotIndexes = [];
    };

    for (const token of this.pattern.tokens) {
      if (token.type !== 'slot') {
        pushSection();
        continue;
      }

      if (currentSegment !== token.segment || currentPattern !== token.pattern) {
        pushSection();
        currentSegment = token.segment;
        currentPattern = token.pattern;
      }

      currentSlotIndexes.push(token.slotIndex);
    }

    pushSection();

    return sections;
  }

  private _extractDigits(value: string): readonly string[] {
    return Array.from(value.matchAll(DIGIT_PATTERN), (match) => match[0]).filter(isDigit);
  }

}
