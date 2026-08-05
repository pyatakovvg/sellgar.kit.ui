import type {
  FormattedInputEditorState,
  TFormattedInputEditorCommand,
} from '../../core';
import type { TFormattedInputMaskToken } from './mask-config';
import {
  FormattedInputMaskDraft,
  findNextAcceptedChar,
} from './mask-draft';
import type { FormattedInputMaskCursorMapper } from './mask-cursor-mapper';
import type { IFormattedInputMaskRawToken } from './mask-draft';

export interface IFormattedInputMaskEditResult {
  readonly draft: FormattedInputMaskDraft;
  readonly rawOffset: number;
}

export class FormattedInputMaskEditStrategy {
  private readonly _cursorMapper: FormattedInputMaskCursorMapper;
  private readonly _draftFactory: (rawValue: string) => FormattedInputMaskDraft;
  private readonly _rawTokens: readonly IFormattedInputMaskRawToken[];
  private readonly _slotCapacity: number;
  private readonly _tokens: readonly TFormattedInputMaskToken[];

  constructor(options: {
    cursorMapper: FormattedInputMaskCursorMapper;
    draftFactory: (rawValue: string) => FormattedInputMaskDraft;
    rawTokens: readonly IFormattedInputMaskRawToken[];
    slotCapacity: number;
    tokens: readonly TFormattedInputMaskToken[];
  }) {
    this._cursorMapper = options.cursorMapper;
    this._draftFactory = options.draftFactory;
    this._rawTokens = options.rawTokens;
    this._slotCapacity = options.slotCapacity;
    this._tokens = options.tokens;
  }

  deleteBackward(state: FormattedInputEditorState): IFormattedInputMaskEditResult | null {
    if (!state.selection.isCollapsed()) {
      return this.replaceSelection(state, '', true);
    }

    const draft = this._createDraft(state.getRawValue());
    const slotIndex = this._getPreviousFilledSlotIndex(draft, state.selection.focus.position.rawOffset);

    if (slotIndex === null) {
      return null;
    }

    return this._removeSlots(draft, slotIndex, slotIndex + 1);
  }

  deleteForward(state: FormattedInputEditorState): IFormattedInputMaskEditResult | null {
    if (!state.selection.isCollapsed()) {
      return this.replaceSelection(state, '', true);
    }

    const draft = this._createDraft(state.getRawValue());
    const slotIndex = this._getNextFilledSlotIndex(draft, state.selection.focus.position.rawOffset);

    if (slotIndex === null) {
      return null;
    }

    return this._removeSlots(draft, slotIndex, slotIndex + 1);
  }

  replaceSelection(
    state: FormattedInputEditorState,
    text: string,
    shouldConsumeLiterals: boolean,
  ): IFormattedInputMaskEditResult | null {
    const range = state.selection.getRawRange();
    const startSlotIndex = this._cursorMapper.getSlotIndexAtRawOffset(range.start);
    const draft = this._createDraft(state.getRawValue());
    const endSlotIndex =
      text.length === 0 && range.start === 0 && range.end >= state.getRawValue().length
        ? this._slotCapacity
        : this._cursorMapper.getSlotIndexAtRawOffset(range.end);
    const insertValues = this._extractInsertValues(text, startSlotIndex, shouldConsumeLiterals);

    if (text.length > 0 && insertValues.length === 0) {
      return null;
    }

    const nextDraft = draft.replaceSlots(startSlotIndex, endSlotIndex, insertValues);
    const nextRawValue = nextDraft.toRawValue();
    const nextRawOffset = this._cursorMapper.getRawOffsetAfterSlotValues(
      startSlotIndex + insertValues.length,
      nextRawValue,
    );

    return {
      draft: nextDraft,
      rawOffset: nextRawOffset,
    };
  }

  shouldConsumeLiterals(command: TFormattedInputEditorCommand): boolean {
    return command.type !== 'insertText';
  }

  private _createDraft(rawValue: string): FormattedInputMaskDraft {
    return this._draftFactory(rawValue);
  }

  private _removeSlots(
    draft: FormattedInputMaskDraft,
    startSlotIndex: number,
    endSlotIndex: number,
  ): IFormattedInputMaskEditResult {
    const nextDraft = draft.removeSlots(startSlotIndex, endSlotIndex);
    const nextRawValue = nextDraft.toRawValue();
    const nextRawOffset = this._cursorMapper.getRawOffsetAfterSlotValues(startSlotIndex, nextRawValue);

    return {
      draft: nextDraft,
      rawOffset: nextRawOffset,
    };
  }

  private _getNextFilledSlotIndex(draft: FormattedInputMaskDraft, rawOffset: number): number | null {
    for (const rawToken of this._rawTokens) {
      if (rawToken.rawIndex < rawOffset || rawToken.token.type !== 'slot' || rawToken.slotIndex === null) {
        continue;
      }

      if (draft.getSlotValues()[rawToken.slotIndex] !== void 0) {
        return rawToken.slotIndex;
      }
    }

    return null;
  }

  private _getPreviousFilledSlotIndex(draft: FormattedInputMaskDraft, rawOffset: number): number | null {
    let slotIndex: number | null = null;

    for (const rawToken of this._rawTokens) {
      if (rawToken.rawIndex >= rawOffset) {
        break;
      }

      if (
        rawToken.token.type === 'slot' &&
        rawToken.slotIndex !== null &&
        draft.getSlotValues()[rawToken.slotIndex] !== void 0
      ) {
        slotIndex = rawToken.slotIndex;
      }
    }

    return slotIndex;
  }

  private _extractInsertValues(text: string, startSlotIndex: number, shouldConsumeLiterals: boolean): string[] {
    if (shouldConsumeLiterals) {
      return this._extractPasteValues(text.trimStart(), startSlotIndex);
    }

    const values: string[] = [];
    let textIndex = 0;
    let slotIndex = 0;

    for (const rawToken of this._rawTokens) {
      if (textIndex >= text.length || values.length >= this._slotCapacity - startSlotIndex) {
        break;
      }

      if (rawToken.token.type === 'literal') {
        continue;
      }

      if (slotIndex < startSlotIndex) {
        slotIndex++;
        continue;
      }

      const char = findNextAcceptedChar(text, textIndex, rawToken.token.rule);

      if (char === null) {
        break;
      }

      values.push(char.value);
      textIndex = char.nextIndex;
      slotIndex++;
    }

    return values;
  }

  private _extractPasteValues(text: string, startSlotIndex: number): string[] {
    const values: string[] = [];
    let textIndex = 0;
    let slotIndex = 0;

    for (const token of this._tokens) {
      if (textIndex >= text.length || values.length >= this._slotCapacity - startSlotIndex) {
        break;
      }

      if (token.type === 'separator' || token.type === 'literal') {
        textIndex = this._consumeStaticPasteToken(text, textIndex, token.char, this._getNextSlotRule(token));
        continue;
      }

      if (slotIndex < startSlotIndex) {
        slotIndex++;
        continue;
      }

      const char = findNextAcceptedChar(text, textIndex, token.rule);

      if (char === null) {
        break;
      }

      values.push(char.value);
      textIndex = char.nextIndex;
      slotIndex++;
    }

    return values;
  }

  private _consumeStaticPasteToken(
    text: string,
    startIndex: number,
    char: string,
    nextSlotRule: { accepts(char: string): boolean } | null,
  ): number {
    if (text[startIndex] === char) {
      return startIndex + 1;
    }

    const charIndex = text.indexOf(char, startIndex);

    if (charIndex < 0) {
      return startIndex;
    }

    if (nextSlotRule === null) {
      return charIndex + 1;
    }

    for (let index = startIndex; index < charIndex; index++) {
      if (nextSlotRule.accepts(text[index])) {
        return startIndex;
      }
    }

    return charIndex + 1;
  }

  private _getNextSlotRule(token: TFormattedInputMaskToken): { accepts(char: string): boolean } | null {
    const tokenIndex = this._tokens.indexOf(token);

    for (let index = tokenIndex + 1; index < this._tokens.length; index++) {
      const nextToken = this._tokens[index];

      if (nextToken.type === 'slot') {
        return nextToken.rule;
      }
    }

    return null;
  }
}
