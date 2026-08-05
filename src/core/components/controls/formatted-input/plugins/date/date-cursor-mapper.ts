import {
  FormattedInputCaret,
  FormattedInputPosition,
  FormattedInputSelection,
} from '../../core';

import type { TFormattedInputCaretAffinity } from '../../core';
import type { FormattedInputDateConfig } from './date-config';
import type { FormattedInputDateDraft } from './date-draft';
import type { FormattedInputTemporalSection } from './temporal-section';

interface IFormattedInputDateVisualPosition {
  readonly affinity: TFormattedInputCaretAffinity;
  readonly visualOffset: number;
}

export class FormattedInputDateCursorMapper {
  private readonly _config: FormattedInputDateConfig;

  constructor(config: FormattedInputDateConfig) {
    this._config = config;
  }

  createCollapsedSelection(
    draft: FormattedInputDateDraft,
    rawOffset: number,
    preferredSection?: FormattedInputTemporalSection | null,
  ): FormattedInputSelection {
    const section = preferredSection ?? this._config.getSectionForRawOffset(rawOffset);

    if (section !== null) {
      return this.createSectionSelection(draft, section, rawOffset);
    }

    return this._createSelectionAtOffset(this._config.normalizeRawOffset(rawOffset));
  }

  createPointerSelection(
    draft: FormattedInputDateDraft,
    selection: FormattedInputSelection,
  ): FormattedInputSelection {
    if (!selection.isCollapsed()) {
      return this.createRangeSelection(selection);
    }

    const visualOffset = selection.focus.position.visualOffset;
    const section = this._config.getSectionForVisualOffset(visualOffset);

    if (section !== null && this._isSectionEmpty(draft, section)) {
      return this.createSectionSelection(draft, section, section.start);
    }

    return this.createCollapsedSelection(draft, selection.focus.position.rawOffset, section);
  }

  createRangeSelection(selection: FormattedInputSelection): FormattedInputSelection {
    const anchorRawOffset = this._config.normalizeRawOffset(selection.anchor.position.rawOffset);
    const focusRawOffset = this._config.normalizeRawOffset(selection.focus.position.rawOffset);

    if (anchorRawOffset === focusRawOffset) {
      return this._createSelectionAtOffset(focusRawOffset);
    }

    return new FormattedInputSelection({
      anchor: this._createCaret(anchorRawOffset, this.getBoundaryVisualOffset(anchorRawOffset)),
      focus: this._createCaret(focusRawOffset, this.getBoundaryVisualOffset(focusRawOffset)),
      direction: selection.direction,
    });
  }

  createSectionSelection(
    draft: FormattedInputDateDraft,
    section: FormattedInputTemporalSection,
    rawOffset = this.getPreferredSectionRawOffset(draft, section),
  ): FormattedInputSelection {
    const normalizedRawOffset = this._normalizeSectionRawOffset(section, rawOffset);
    const visualPosition = this.getSectionVisualPosition(section, normalizedRawOffset);

    return new FormattedInputSelection({
      anchor: this._createCaret(normalizedRawOffset, visualPosition.visualOffset, visualPosition.affinity),
      focus: this._createCaret(normalizedRawOffset, visualPosition.visualOffset, visualPosition.affinity),
      direction: 'none',
    });
  }

  getAdjacentSection(
    selection: FormattedInputSelection,
    direction: 'left' | 'right',
  ): FormattedInputTemporalSection | null {
    const currentSection = this._config.getSectionForVisualOffset(selection.focus.position.visualOffset);

    if (currentSection === null) {
      return direction === 'left'
        ? (this._config.sections[this._config.sections.length - 1] ?? null)
        : (this._config.sections[0] ?? null);
    }

    const nextOrder = direction === 'left' ? currentSection.order - 1 : currentSection.order + 1;

    return this._config.sections[nextOrder] ?? null;
  }

  getBoundaryVisualOffset(rawOffset: number): number {
    const normalizedRawOffset = this._config.normalizeRawOffset(rawOffset);

    for (const token of this._config.pattern.tokens) {
      if (token.type === 'slot' && token.slotIndex >= normalizedRawOffset) {
        return this._config.pattern.tokens.indexOf(token);
      }
    }

    return this._config.pattern.tokens.length;
  }

  getPreferredSectionRawOffset(
    draft: FormattedInputDateDraft,
    section: FormattedInputTemporalSection,
  ): number {
    for (let slotIndex = section.end - 1; slotIndex >= section.start; slotIndex--) {
      if (draft.getSlot(slotIndex) !== void 0) {
        return slotIndex + 1;
      }
    }

    return section.start;
  }

  getSectionVisualOffset(section: FormattedInputTemporalSection, rawOffset: number): number {
    return this.getSectionVisualPosition(section, rawOffset).visualOffset;
  }

  getSectionVisualPosition(
    section: FormattedInputTemporalSection,
    rawOffset: number,
  ): IFormattedInputDateVisualPosition {
    if (rawOffset <= section.start) {
      return {
        affinity: 'before',
        visualOffset: this._getVisualOffsetForSlot(section.start),
      };
    }

    if (rawOffset >= section.end) {
      return {
        affinity: 'after',
        visualOffset: this._getVisualOffsetForSlot(section.end - 1),
      };
    }

    return {
      affinity: 'before',
      visualOffset: this._getVisualOffsetForSlot(rawOffset),
    };
  }

  private _createCaret(
    rawOffset: number,
    visualOffset: number,
    affinity: TFormattedInputCaretAffinity = 'before',
  ): FormattedInputCaret {
    return new FormattedInputCaret({
      position: new FormattedInputPosition({
        affinity,
        rawOffset,
        visualOffset,
      }),
    });
  }

  private _createSelectionAtOffset(rawOffset: number): FormattedInputSelection {
    const visualOffset = this.getBoundaryVisualOffset(rawOffset);
    const caret = this._createCaret(rawOffset, visualOffset);

    return new FormattedInputSelection({
      anchor: caret,
      focus: caret,
      direction: 'none',
    });
  }

  private _getVisualOffsetForSlot(slotIndex: number): number {
    for (const token of this._config.pattern.tokens) {
      if (token.type === 'slot' && token.slotIndex === slotIndex) {
        return this._config.pattern.tokens.indexOf(token);
      }
    }

    return this._config.pattern.tokens.length;
  }

  private _isSectionEmpty(draft: FormattedInputDateDraft, section: FormattedInputTemporalSection): boolean {
    for (const slotIndex of section.slotIndexes) {
      if (draft.getSlot(slotIndex) !== void 0) {
        return false;
      }
    }

    return true;
  }

  private _normalizeSectionRawOffset(section: FormattedInputTemporalSection, rawOffset: number): number {
    if (rawOffset < section.start) {
      return section.start;
    }

    if (rawOffset > section.end) {
      return section.end;
    }

    return rawOffset;
  }
}
