import {
  FormattedInputCaret,
  FormattedInputPosition,
  FormattedInputSelection,
} from '../../core';

import type { TFormattedInputCaretAffinity } from '../../core';
import type { TFormattedInputMaskToken } from './mask-config';
import type { IFormattedInputMaskRawToken } from './mask-draft';

export class FormattedInputMaskCursorMapper {
  private readonly _rawTokens: readonly IFormattedInputMaskRawToken[];
  private readonly _tokens: readonly TFormattedInputMaskToken[];

  constructor(options: {
    rawTokens: readonly IFormattedInputMaskRawToken[];
    tokens: readonly TFormattedInputMaskToken[];
  }) {
    this._rawTokens = options.rawTokens;
    this._tokens = options.tokens;
  }

  createCollapsedSelection(rawOffset: number, rawValue: string): FormattedInputSelection {
    const normalizedRawOffset = this.normalizeCaretRawOffset(rawOffset, rawValue, 'right');
    const caret = this.createCaret(normalizedRawOffset, rawValue, 'caret');

    return new FormattedInputSelection({
      anchor: caret,
      focus: caret,
      direction: 'none',
    });
  }

  createRangeSelection(
    anchorRawOffset: number,
    focusRawOffset: number,
    rawValue: string,
    direction: FormattedInputSelection['direction'],
    anchorDirection: 'left' | 'right',
    focusDirection: 'left' | 'right',
  ): FormattedInputSelection {
    const isCollapsed = anchorRawOffset === focusRawOffset;
    const anchor = isCollapsed
      ? this.normalizeCaretRawOffset(anchorRawOffset, rawValue, anchorDirection)
      : this.normalizeSelectionBoundaryRawOffset(anchorRawOffset, rawValue, anchorDirection);
    const focus = isCollapsed
      ? this.normalizeCaretRawOffset(focusRawOffset, rawValue, focusDirection)
      : this.normalizeSelectionBoundaryRawOffset(focusRawOffset, rawValue, focusDirection);

    return new FormattedInputSelection({
      anchor: this.createCaret(anchor, rawValue, isCollapsed ? 'caret' : 'boundary'),
      focus: this.createCaret(focus, rawValue, isCollapsed ? 'caret' : 'boundary'),
      direction,
    });
  }

  createCaret(rawOffset: number, rawValue: string, mode: 'boundary' | 'caret'): FormattedInputCaret {
    const visualPosition =
      mode === 'boundary'
        ? this.getBoundaryVisualPosition(rawOffset, rawValue)
        : this.getCaretVisualPosition(rawOffset, rawValue);

    return new FormattedInputCaret({
      position: new FormattedInputPosition({
        affinity: visualPosition.affinity,
        rawOffset,
        visualOffset: visualPosition.visualOffset,
      }),
    });
  }

  getBoundaryVisualOffset(rawOffset: number, rawValue: string): number {
    return this.getBoundaryVisualPosition(rawOffset, rawValue).visualOffset;
  }

  getBoundaryVisualPosition(
    rawOffset: number,
    rawValue: string,
  ): { affinity: TFormattedInputCaretAffinity; visualOffset: number } {
    if (rawOffset <= 0) {
      return {
        affinity: 'before',
        visualOffset: 0,
      };
    }

    return this.getCaretVisualPosition(rawOffset, rawValue);
  }

  getCaretVisualOffset(rawOffset: number, rawValue: string): number {
    return this.getCaretVisualPosition(rawOffset, rawValue).visualOffset;
  }

  getCaretVisualPosition(
    rawOffset: number,
    rawValue: string,
  ): { affinity: TFormattedInputCaretAffinity; visualOffset: number } {
    let currentRawOffset = 0;
    let visualOffset = 0;
    let lastRawVisualOffset = 0;

    for (const token of this._tokens) {
      if (token.type === 'separator') {
        visualOffset++;
        continue;
      }

      if (currentRawOffset >= rawOffset) {
        return {
          affinity: 'before',
          visualOffset,
        };
      }

      lastRawVisualOffset = visualOffset;
      currentRawOffset++;
      visualOffset++;
    }

    return {
      affinity: 'after',
      visualOffset: lastRawVisualOffset,
    };
  }

  getFirstEditableRawOffset(rawValue: string): number {
    for (const rawToken of this._rawTokens) {
      if (rawToken.token.type === 'slot') {
        return rawToken.rawIndex;
      }
    }

    return 0;
  }

  getNextSlotIndex(rawOffset: number): number | null {
    for (const rawToken of this._rawTokens) {
      if (rawToken.rawIndex < rawOffset || rawToken.token.type !== 'slot') {
        continue;
      }

      return rawToken.slotIndex;
    }

    return null;
  }

  getPreviousSlotIndex(rawOffset: number): number | null {
    let slotIndex = -1;

    for (const rawToken of this._rawTokens) {
      if (rawToken.rawIndex >= rawOffset) {
        break;
      }

      if (rawToken.token.type === 'slot') {
        slotIndex = rawToken.slotIndex ?? slotIndex;
      }
    }

    return slotIndex < 0 ? null : slotIndex;
  }

  getRawOffsetAfterSlotValues(slotCount: number, rawValue: string): number {
    if (slotCount <= 0) {
      return this.getFirstEditableRawOffset(rawValue);
    }

    let seenSlots = 0;

    for (const rawToken of this._rawTokens) {
      if (rawToken.token.type !== 'slot') {
        continue;
      }

      seenSlots++;

      if (seenSlots === slotCount) {
        return this.normalizeCaretRawOffset(rawToken.rawIndex + 1, rawValue, 'right');
      }
    }

    return rawValue.length;
  }

  getSlotIndexAtRawOffset(rawOffset: number): number {
    let slotIndex = 0;

    for (const rawToken of this._rawTokens) {
      if (rawToken.token.type !== 'slot') {
        continue;
      }

      if (rawToken.rawIndex >= rawOffset) {
        return slotIndex;
      }

      slotIndex++;
    }

    return slotIndex;
  }

  normalizeCaretRawOffset(rawOffset: number, rawValue: string, direction: 'left' | 'right'): number {
    const firstEditableRawOffset = this.getFirstEditableRawOffset(rawValue);
    const lastEditableRawOffset = this._getRawCapacity();
    let normalizedRawOffset = rawOffset;

    if (normalizedRawOffset < firstEditableRawOffset) {
      return firstEditableRawOffset;
    }

    if (normalizedRawOffset > lastEditableRawOffset) {
      return lastEditableRawOffset;
    }

    while (this._isLiteralRawOffset(normalizedRawOffset)) {
      normalizedRawOffset += direction === 'left' ? -1 : 1;

      if (normalizedRawOffset < firstEditableRawOffset) {
        return firstEditableRawOffset;
      }

      if (normalizedRawOffset > lastEditableRawOffset) {
        return lastEditableRawOffset;
      }
    }

    return normalizedRawOffset;
  }

  normalizeSelectionBoundaryRawOffset(
    rawOffset: number,
    rawValue: string,
    direction: 'left' | 'right',
  ): number {
    if (rawOffset <= 0) {
      return 0;
    }

    const rawCapacity = this._getRawCapacity();

    if (rawOffset >= rawCapacity) {
      return rawCapacity;
    }

    return this.normalizeCaretRawOffset(rawOffset, rawValue, direction);
  }

  private _getRawCapacity(): number {
    return this._rawTokens.length;
  }

  private _isLiteralRawOffset(rawOffset: number): boolean {
    for (const rawToken of this._rawTokens) {
      if (rawToken.rawIndex !== rawOffset) {
        continue;
      }

      return rawToken.token.type === 'literal';
    }

    return false;
  }
}
