import type { FormattedInputSelection } from '../../core';
import type { FormattedInputDateConfig } from './date-config';
import type { FormattedInputDateDraft } from './date-draft';
import type { FormattedInputTemporalSection } from './temporal-section';

export interface IFormattedInputDateEditResult {
  readonly changed: boolean;
  readonly draft: FormattedInputDateDraft;
  readonly rawOffset: number;
  readonly section: FormattedInputTemporalSection | null;
}

export class FormattedInputDateEditStrategy {
  private readonly _config: FormattedInputDateConfig;

  constructor(config: FormattedInputDateConfig) {
    this._config = config;
  }

  deleteBackward(draft: FormattedInputDateDraft, selection: FormattedInputSelection): IFormattedInputDateEditResult {
    if (!selection.isCollapsed()) {
      return this._createNoopResult(draft, selection.focus.position.rawOffset);
    }

    const slotIndex = this._getBackspaceSlotIndex(draft, selection);

    if (slotIndex === null) {
      return this._createNoopResult(draft, selection.focus.position.rawOffset);
    }

    const section = this._config.getSectionForSlot(slotIndex);
    const nextDraft = draft.setSlot(slotIndex, void 0);

    return {
      changed: !nextDraft.equals(draft),
      draft: nextDraft,
      rawOffset: slotIndex,
      section,
    };
  }

  insertDigit(
    draft: FormattedInputDateDraft,
    selection: FormattedInputSelection,
    digit: string,
  ): IFormattedInputDateEditResult {
    if (!selection.isCollapsed() || digit.length !== 1 || !this._isDigit(digit)) {
      return this._createNoopResult(draft, selection.focus.position.rawOffset);
    }

    const section = this._getInsertSection(draft, selection);

    if (section === null) {
      return this._createNoopResult(draft, selection.focus.position.rawOffset);
    }

    const slotIndex = this._getInsertSlotIndex(section, selection.focus.position.rawOffset);
    const candidate = this._createInsertCandidate(draft, section, slotIndex, digit);

    if (!this._config.isDraftAllowed(candidate)) {
      return this._createNoopResult(draft, selection.focus.position.rawOffset);
    }

    const nextPosition = this._getNextInsertPosition(candidate, section, slotIndex + 1);

    return {
      changed: !candidate.equals(draft),
      draft: candidate,
      rawOffset: nextPosition.rawOffset,
      section: nextPosition.section,
    };
  }

  moveSection(
    draft: FormattedInputDateDraft,
    section: FormattedInputTemporalSection | null,
  ): IFormattedInputDateEditResult | null {
    if (section === null) {
      return null;
    }

    return {
      changed: false,
      draft,
      rawOffset: this.getPreferredSectionRawOffset(draft, section),
      section,
    };
  }

  getPreferredSectionRawOffset(draft: FormattedInputDateDraft, section: FormattedInputTemporalSection): number {
    for (let slotIndex = section.end - 1; slotIndex >= section.start; slotIndex--) {
      if (draft.getSlot(slotIndex) !== void 0) {
        return slotIndex + 1;
      }
    }

    return section.start;
  }

  private _createNoopResult(draft: FormattedInputDateDraft, rawOffset: number): IFormattedInputDateEditResult {
    return {
      changed: false,
      draft,
      rawOffset,
      section: null,
    };
  }

  private _createInsertCandidate(
    draft: FormattedInputDateDraft,
    section: FormattedInputTemporalSection,
    slotIndex: number,
    digit: string,
  ): FormattedInputDateDraft {
    const candidate = draft.setSlot(slotIndex, digit);

    if (this._config.isDraftAllowed(candidate)) {
      return candidate;
    }

    const trailingSlotIndexes = section.slotIndexes.filter((sectionSlotIndex) => sectionSlotIndex > slotIndex);

    if (trailingSlotIndexes.length === 0) {
      return candidate;
    }

    return draft.clearSlots(trailingSlotIndexes).setSlot(slotIndex, digit);
  }

  private _getActiveSection(selection: FormattedInputSelection): FormattedInputTemporalSection | null {
    return this._config.getSectionForVisualOffset(selection.focus.position.visualOffset);
  }

  private _getInsertSection(
    draft: FormattedInputDateDraft,
    selection: FormattedInputSelection,
  ): FormattedInputTemporalSection | null {
    const activeSection = this._getActiveSection(selection);

    if (activeSection === null) {
      return null;
    }

    if (
      selection.focus.position.rawOffset >= activeSection.end &&
      this._isSectionComplete(draft, activeSection)
    ) {
      return this._config.sections[activeSection.order + 1] ?? activeSection;
    }

    return activeSection;
  }

  private _getBackspaceSlotIndex(draft: FormattedInputDateDraft, selection: FormattedInputSelection): number | null {
    const activeSection = this._getActiveSection(selection);

    if (activeSection === null) {
      return null;
    }

    const rawOffset = selection.focus.position.rawOffset;
    const activeSlotIndex = this._findFilledSlotBeforeOffset(draft, activeSection, rawOffset);

    if (activeSlotIndex !== null) {
      return activeSlotIndex;
    }

    for (let sectionIndex = activeSection.order - 1; sectionIndex >= 0; sectionIndex--) {
      const section = this._config.sections[sectionIndex];
      const slotIndex = this._findFilledSlotBeforeOffset(draft, section, section.end);

      if (slotIndex !== null) {
        return slotIndex;
      }
    }

    return null;
  }

  private _getInsertSlotIndex(section: FormattedInputTemporalSection, rawOffset: number): number {
    if (rawOffset < section.start) {
      return section.start;
    }

    if (rawOffset >= section.end) {
      return section.end - 1;
    }

    return rawOffset;
  }

  private _getNextInsertPosition(
    draft: FormattedInputDateDraft,
    section: FormattedInputTemporalSection,
    rawOffset: number,
  ): { rawOffset: number; section: FormattedInputTemporalSection } {
    const normalizedRawOffset = Math.min(rawOffset, section.end);

    if (normalizedRawOffset < section.end || !this._isSectionComplete(draft, section)) {
      return {
        rawOffset: normalizedRawOffset,
        section,
      };
    }

    const nextSection = this._config.sections[section.order + 1];

    if (nextSection === void 0) {
      return {
        rawOffset: normalizedRawOffset,
        section,
      };
    }

    return {
      rawOffset: this.getPreferredSectionRawOffset(draft, nextSection),
      section: nextSection,
    };
  }

  private _findFilledSlotBeforeOffset(
    draft: FormattedInputDateDraft,
    section: FormattedInputTemporalSection,
    rawOffset: number,
  ): number | null {
    const startSlotIndex = Math.min(rawOffset - 1, section.end - 1);

    for (let slotIndex = startSlotIndex; slotIndex >= section.start; slotIndex--) {
      if (draft.getSlot(slotIndex) !== void 0) {
        return slotIndex;
      }
    }

    return null;
  }

  private _isDigit(value: string): boolean {
    return value >= '0' && value <= '9';
  }

  private _isSectionComplete(draft: FormattedInputDateDraft, section: FormattedInputTemporalSection): boolean {
    for (const slotIndex of section.slotIndexes) {
      if (draft.getSlot(slotIndex) === void 0) {
        return false;
      }
    }

    return true;
  }
}
