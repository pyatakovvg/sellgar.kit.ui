import {
  FormattedInputDocument,
  FormattedInputEditorState,
  FormattedInputGroup,
  FormattedInputLine,
  FormattedInputSelection,
  FormattedInputSymbolConfig,
  FormattedInputSymbolNode,
} from '../../core';

import type {
  IFormattedInputEditorTransactionResult,
  TFormattedInputEditorCommand,
  TFormattedInputEditorOperation,
} from '../../core';
import type { FormattedInputPluginContext, IFormattedInputPlugin } from '../plugin';
import { FormattedInputMaskConfig } from './mask-config';
import { FormattedInputMaskCursorMapper } from './mask-cursor-mapper';
import { FormattedInputMaskDraft } from './mask-draft';
import { FormattedInputMaskEditStrategy } from './mask-edit-strategy';

import type { TFormattedInputMaskToken, TFormattedInputMaskTokenOptions } from './mask-config';
import type { IFormattedInputMaskRawToken } from './mask-draft';
import cn from 'classnames';

export interface IFormattedInputMaskPluginOptions {
  mask: readonly TFormattedInputMaskTokenOptions[];
  name?: string;
  priority?: number;
}

export class FormattedInputMaskPlugin implements IFormattedInputPlugin {
  readonly name: string;
  readonly priority?: number;
  private readonly _config: FormattedInputMaskConfig;
  private readonly _cursorMapper: FormattedInputMaskCursorMapper;
  private readonly _editStrategy: FormattedInputMaskEditStrategy;
  private readonly _rawTokens: readonly IFormattedInputMaskRawToken[];
  private readonly _slotCapacity: number;
  private _draft: FormattedInputMaskDraft | null = null;
  private _rawValue = '';

  constructor(options: IFormattedInputMaskPluginOptions) {
    const config = new FormattedInputMaskConfig({
      mask: options.mask,
    });

    this.name = options.name ?? 'mask';
    this.priority = options.priority;
    this._config = config;
    this._rawTokens = FormattedInputMaskDraft.createRawTokens(config.tokens);
    this._slotCapacity = config.getSlotCapacity();
    this._cursorMapper = new FormattedInputMaskCursorMapper({
      rawTokens: this._rawTokens,
      tokens: config.tokens,
    });
    this._editStrategy = new FormattedInputMaskEditStrategy({
      cursorMapper: this._cursorMapper,
      draftFactory: (rawValue) => this._resolveDraft(rawValue),
      rawTokens: this._rawTokens,
      slotCapacity: this._slotCapacity,
      tokens: config.tokens,
    });
  }

  execute(context: FormattedInputPluginContext): FormattedInputPluginContext {
    if (context.phase === 'createState') {
      const selection = context.selection ?? FormattedInputSelection.collapsed(context.rawOffset);

      return context.setState(this._createState(context.rawValue, selection));
    }

    if (context.phase !== 'dispatchCommand' || context.command === null) {
      return context;
    }

    const transaction = this._dispatchCommand(context.command, context.getState());

    if (transaction === null) {
      return context;
    }

    return context.setTransaction(transaction).markHandled();
  }

  private _dispatchCommand(
    command: TFormattedInputEditorCommand,
    state: FormattedInputEditorState | null,
  ): IFormattedInputEditorTransactionResult | null {
    if (state === null) {
      return null;
    }

    if (command.type === 'copySelection') {
      return this._copySelection(state, command);
    }

    if (command.type === 'cutSelection') {
      return this._cutSelection(state, command);
    }

    if (command.type === 'deleteBackward') {
      return this._deleteBackward(state, command);
    }

    if (command.type === 'deleteForward') {
      return this._deleteForward(state, command);
    }

    if (command.type === 'moveCaret') {
      return this._moveCaret(state, command);
    }

    if (command.type === 'setSelection') {
      return this._setSelection(state, command);
    }

    if (command.type === 'insertText' || command.type === 'pasteText' || command.type === 'replaceSelection') {
      return this._replaceSelection(state, command, command.text);
    }

    return null;
  }

  private _createState(rawValue: string, selection: FormattedInputSelection): FormattedInputEditorState {
    return this._createStateFromDraft(this._resolveDraft(rawValue), selection);
  }

  private _createStateFromDraft(
    draft: FormattedInputMaskDraft,
    selection: FormattedInputSelection,
  ): FormattedInputEditorState {
    const normalizedRawValue = draft.toRawValue();
    const document = this._createDocument(draft);
    const normalizedSelection = this._normalizeSelection(selection, normalizedRawValue);

    this._draft = draft;
    this._rawValue = normalizedRawValue;

    return new FormattedInputEditorState({
      document,
      selection: normalizedSelection,
      composition: null,
    });
  }

  private _copySelection(
    state: FormattedInputEditorState,
    command: TFormattedInputEditorCommand,
  ): IFormattedInputEditorTransactionResult {
    return {
      before: state,
      command,
      operations: [],
      after: state,
      clipboardText: this._extractSelectionText(state),
    };
  }

  private _cutSelection(
    state: FormattedInputEditorState,
    command: TFormattedInputEditorCommand,
  ): IFormattedInputEditorTransactionResult {
    const clipboardText = this._extractSelectionText(state);
    const transaction = this._replaceSelection(state, command, '');

    return {
      ...transaction,
      clipboardText,
    };
  }

  private _deleteBackward(
    state: FormattedInputEditorState,
    command: TFormattedInputEditorCommand,
  ): IFormattedInputEditorTransactionResult {
    if (!state.selection.isCollapsed()) {
      return this._replaceSelection(state, command, '');
    }

    const result = this._editStrategy.deleteBackward(state);

    if (result === null) {
      return this._createNoopTransaction(state, command);
    }

    return this._createReplaceTransaction(state, command, result.draft, result.rawOffset);
  }

  private _deleteForward(
    state: FormattedInputEditorState,
    command: TFormattedInputEditorCommand,
  ): IFormattedInputEditorTransactionResult {
    if (!state.selection.isCollapsed()) {
      return this._replaceSelection(state, command, '');
    }

    const result = this._editStrategy.deleteForward(state);

    if (result === null) {
      return this._createNoopTransaction(state, command);
    }

    return this._createReplaceTransaction(state, command, result.draft, result.rawOffset);
  }

  private _moveCaret(
    state: FormattedInputEditorState,
    command: Extract<TFormattedInputEditorCommand, { type: 'moveCaret' }>,
  ): IFormattedInputEditorTransactionResult {
    const rawValue = state.getRawValue();
    const currentRawOffset = state.selection.focus.position.rawOffset;

    if (command.direction === 'start') {
      return this._createSelectionTransaction(
        state,
        command,
        this._cursorMapper.createCollapsedSelection(this._cursorMapper.getFirstEditableRawOffset(rawValue), rawValue),
      );
    }

    if (command.direction === 'end') {
      return this._createSelectionTransaction(
        state,
        command,
        this._cursorMapper.createCollapsedSelection(rawValue.length, rawValue),
      );
    }

    const direction = command.direction;
    const nextRawOffset = direction === 'left' ? currentRawOffset - 1 : currentRawOffset + 1;
    const normalizedRawOffset = this._cursorMapper.normalizeCaretRawOffset(nextRawOffset, rawValue, direction);

    return this._createSelectionTransaction(
      state,
      command,
      this._cursorMapper.createCollapsedSelection(normalizedRawOffset, rawValue),
    );
  }

  private _setSelection(
    state: FormattedInputEditorState,
    command: Extract<TFormattedInputEditorCommand, { type: 'setSelection' }>,
  ): IFormattedInputEditorTransactionResult {
    const rawValue = state.getRawValue();
    const currentRawOffset = state.selection.focus.position.rawOffset;
    const anchorRawOffset = command.selection.anchor.position.rawOffset;
    const focusRawOffset = command.selection.focus.position.rawOffset;
    const anchorDirection = anchorRawOffset < currentRawOffset ? 'left' : 'right';
    const focusDirection = focusRawOffset < currentRawOffset ? 'left' : 'right';
    const isCollapsed = anchorRawOffset === focusRawOffset;
    const selection = this._cursorMapper.createRangeSelection(
      anchorRawOffset,
      focusRawOffset,
      rawValue,
      command.selection.direction,
      anchorDirection,
      focusDirection,
    );

    return this._createSelectionTransaction(state, command, selection);
  }

  private _replaceSelection(
    state: FormattedInputEditorState,
    command: TFormattedInputEditorCommand,
    text: string,
  ): IFormattedInputEditorTransactionResult {
    const result = this._editStrategy.replaceSelection(
      state,
      text,
      this._editStrategy.shouldConsumeLiterals(command),
    );

    if (result === null) {
      return this._createNoopTransaction(state, command);
    }

    return this._createReplaceTransaction(state, command, result.draft, result.rawOffset);
  }

  private _createReplaceTransaction(
    state: FormattedInputEditorState,
    command: TFormattedInputEditorCommand,
    nextDraft: FormattedInputMaskDraft,
    nextRawOffset: number,
  ): IFormattedInputEditorTransactionResult {
    const nextRawValue = nextDraft.toRawValue();
    const after = this._createStateFromDraft(
      nextDraft,
      this._cursorMapper.createCollapsedSelection(nextRawOffset, nextRawValue),
    );
    const operation: TFormattedInputEditorOperation = {
      type: 'replaceRawRange',
      start: 0,
      end: state.getRawValue().length,
      text: nextRawValue,
    };

    return {
      before: state,
      command,
      operations: [operation],
      after,
      clipboardText: null,
    };
  }

  private _createNoopTransaction(
    state: FormattedInputEditorState,
    command: TFormattedInputEditorCommand,
  ): IFormattedInputEditorTransactionResult {
    return {
      before: state,
      command,
      operations: [],
      after: state,
      clipboardText: null,
    };
  }

  private _createSelectionTransaction(
    state: FormattedInputEditorState,
    command: TFormattedInputEditorCommand,
    selection: FormattedInputSelection,
  ): IFormattedInputEditorTransactionResult {
    const after = state.withSelection(selection);
    const operation: TFormattedInputEditorOperation = {
      type: 'setSelection',
      selection,
    };

    return {
      before: state,
      command,
      operations: [operation],
      after,
      clipboardText: null,
    };
  }

  private _createDocument(draft: FormattedInputMaskDraft): FormattedInputDocument {
    const symbols: FormattedInputSymbolNode[] = [];
    const rawValue = draft.toRawValue();
    const slotValues = draft.getSlotValues();
    let slotIndex = 0;
    let rawIndex = 0;
    let visualIndex = 0;

    for (const token of this._config.tokens) {
      const rawOffset = this._getSymbolRawOffset(token, rawValue, rawIndex);
      const symbol = this._createSymbol(token, slotValues[slotIndex], visualIndex, rawOffset);

      symbols.push(
        new FormattedInputSymbolNode({
          symbol,
          lineId: 'line:0',
          groupId: 'group:0',
          ordinal: visualIndex,
          rawOffset,
          visualOffset: visualIndex,
        }),
      );

      if (token.type === 'slot') {
        slotIndex++;
      }

      if (token.type !== 'separator') {
        rawIndex++;
      }

      visualIndex++;
    }

    const group = new FormattedInputGroup({
      id: 'group:0',
      symbols,
    });
    const line = new FormattedInputLine({
      id: 'line:0',
      groups: [group],
    });

    return new FormattedInputDocument({
      id: 'document:0',
      lines: [line],
    });
  }

  private _createSymbol(
    token: TFormattedInputMaskToken,
    slotValue: string | undefined,
    visualIndex: number,
    rawOffset: number | null,
  ): FormattedInputSymbolConfig {
    if (token.type === 'separator') {
      return new FormattedInputSymbolConfig({
        id: `separator:${visualIndex}:${token.char}`,
        char: token.char,
        role: 'separator',
        style: this._createStyle(token.className),
      });
    }

    if (token.type === 'literal') {
      return new FormattedInputSymbolConfig({
        id: `literal:${visualIndex}:${token.char}`,
        char: token.char,
        role: 'literal',
        editable: false,
        removable: false,
        raw: rawOffset !== null,
        style: this._createStyle(token.className),
      });
    }

    if (slotValue !== void 0) {
      return new FormattedInputSymbolConfig({
        id: `slot:${visualIndex}:${slotValue}`,
        char: slotValue,
        role: 'editable',
        style: this._createStyle(cn(token.className, token.valueClassName) || void 0),
      });
    }

    return new FormattedInputSymbolConfig({
      id: `placeholder:${visualIndex}:${token.placeholder}`,
      char: token.placeholder,
      role: 'placeholder',
      editable: true,
      removable: false,
      raw: false,
      style: this._createStyle(cn(token.className, token.placeholderClassName) || void 0),
    });
  }

  private _createStyle(className: string | undefined): { className?: string } | undefined {
    if (className === void 0) {
      return void 0;
    }

    return {
      className,
    };
  }

  private _getSymbolRawOffset(token: TFormattedInputMaskToken, rawValue: string, rawIndex: number): number | null {
    if (token.type === 'separator') {
      return null;
    }

    if (token.type === 'slot') {
      return rawIndex;
    }

    if (rawIndex >= rawValue.length) {
      return null;
    }

    return rawIndex;
  }

  private _normalizeRawValue(rawValue: string): string {
    return this._resolveDraft(rawValue).toRawValue();
  }

  private _resolveDraft(rawValue: string): FormattedInputMaskDraft {
    if (this._draft !== null && this._rawValue === rawValue) {
      return this._draft;
    }

    const draft = FormattedInputMaskDraft.fromRawValue(this._rawTokens, this._slotCapacity, rawValue);

    this._draft = draft;
    this._rawValue = draft.toRawValue();

    return draft;
  }

  private _normalizeSelection(selection: FormattedInputSelection, rawValue: string): FormattedInputSelection {
    if (selection.isCollapsed()) {
      return this._cursorMapper.createCollapsedSelection(selection.focus.position.rawOffset, rawValue);
    }

    const anchorRawOffset = selection.anchor.position.rawOffset;
    const focusRawOffset = selection.focus.position.rawOffset;
    const anchorDirection = anchorRawOffset < focusRawOffset ? 'right' : 'left';
    const focusDirection = focusRawOffset < anchorRawOffset ? 'left' : 'right';

    return this._cursorMapper.createRangeSelection(
      anchorRawOffset,
      focusRawOffset,
      rawValue,
      selection.direction,
      anchorDirection,
      focusDirection,
    );
  }

  private _extractSelectionText(state: FormattedInputEditorState): string {
    const range = state.selection.getRawRange();

    return state.getRawValue().slice(range.start, range.end);
  }

}
