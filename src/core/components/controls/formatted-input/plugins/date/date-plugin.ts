import {
  FormattedInputCaret,
  FormattedInputDocument,
  FormattedInputEditorState,
  FormattedInputGroup,
  FormattedInputLine,
  FormattedInputPosition,
  FormattedInputSelection,
  FormattedInputSymbolConfig,
  FormattedInputSymbolNode,
} from '../../core';
import { FormattedInputDateConfig } from './date-config';
import { FormattedInputDateCursorMapper } from './date-cursor-mapper';
import { FormattedInputDateDraft } from './date-draft';
import { FormattedInputDateEditStrategy } from './date-edit-strategy';

import type {
  IFormattedInputEditorTransactionResult,
  TFormattedInputEditorCommand,
  TFormattedInputEditorOperation,
} from '../../core';
import type { IFormattedInputDateTimeSlotToken } from '../datetime';
import type { FormattedInputPluginContext, IFormattedInputPlugin } from '../plugin';
import type { IFormattedInputDateConfigOptions } from './date-config';

export interface IFormattedInputDatePluginOptions extends IFormattedInputDateConfigOptions {}

interface IFormattedInputDateTransactionResult {
  changeValue: string | null;
  shouldNotifyChange: boolean;
  transaction: IFormattedInputEditorTransactionResult;
}

export class FormattedInputDatePlugin implements IFormattedInputPlugin {
  readonly name: string;
  readonly priority?: number;
  private readonly _config: FormattedInputDateConfig;
  private readonly _cursorMapper: FormattedInputDateCursorMapper;
  private readonly _editStrategy: FormattedInputDateEditStrategy;
  private _draft: FormattedInputDateDraft | null = null;
  private _rawValue: string | null = null;

  constructor(options: IFormattedInputDatePluginOptions = {}) {
    this._config = new FormattedInputDateConfig(options);
    this._cursorMapper = new FormattedInputDateCursorMapper(this._config);
    this._editStrategy = new FormattedInputDateEditStrategy(this._config);
    this.name = this._config.name;
    this.priority = this._config.priority;
  }

  execute(context: FormattedInputPluginContext): FormattedInputPluginContext {
    if (context.phase === 'createState') {
      const selection = context.selection ?? FormattedInputSelection.collapsed(context.rawOffset);

      return context.setState(this._createState(context.rawValue, selection));
    }

    if (context.phase !== 'dispatchCommand' || context.command === null) {
      return context;
    }

    const result = this._dispatchCommand(context.command, context.getState(), context.rawValue);

    if (result === null) {
      return context;
    }

    context.setTransaction(result.transaction).markHandled();

    if (result.changeValue !== null) {
      context.setChangeValue(result.changeValue);
    }

    if (!result.shouldNotifyChange) {
      if (result.changeValue === null) {
        context.setChangeValue(context.rawValue);
      }

      return context.suppressChange();
    }

    return context;
  }

  private _copySelection(
    state: FormattedInputEditorState,
    command: TFormattedInputEditorCommand,
  ): IFormattedInputDateTransactionResult {
    return {
      changeValue: null,
      shouldNotifyChange: false,
      transaction: {
        before: state,
        command,
        operations: [],
        after: state,
        clipboardText: this._extractSelectionText(state),
      },
    };
  }

  private _createDocument(draft: FormattedInputDateDraft): FormattedInputDocument {
    const lineId = 'line:0';
    const groupId = 'group:0';
    const symbols: FormattedInputSymbolNode[] = [];
    let visualOffset = 0;

    for (const token of this._config.pattern.tokens) {
      const symbol =
        token.type === 'separator'
          ? new FormattedInputSymbolConfig({
              id: `separator:${visualOffset}:${token.char}`,
              char: token.char,
              role: 'separator',
              style: this._createStyle(this._config.getSeparatorClassName(token)),
            })
          : this._createSlotSymbol(token, draft.getSlot(token.slotIndex), visualOffset);
      const rawOffset = token.type === 'slot' ? token.slotIndex : null;

      symbols.push(
        new FormattedInputSymbolNode({
          symbol,
          lineId,
          groupId,
          ordinal: visualOffset,
          rawOffset,
          visualOffset,
        }),
      );
      visualOffset++;
    }

    const group = new FormattedInputGroup({
      id: groupId,
      symbols,
    });
    const line = new FormattedInputLine({
      id: lineId,
      groups: [group],
    });

    return new FormattedInputDocument({
      id: 'document:0',
      lines: [line],
    });
  }

  private _createNoopTransaction(
    state: FormattedInputEditorState,
    command: TFormattedInputEditorCommand,
  ): IFormattedInputDateTransactionResult {
    return {
      changeValue: null,
      shouldNotifyChange: false,
      transaction: {
        before: state,
        command,
        operations: [],
        after: state,
        clipboardText: null,
      },
    };
  }

  private _createReplaceTransaction(
    state: FormattedInputEditorState,
    command: TFormattedInputEditorCommand,
    currentRawValue: string,
    nextDraft: FormattedInputDateDraft,
    nextSelection: FormattedInputSelection,
  ): IFormattedInputDateTransactionResult {
    const after = this._createStateFromDraft(nextDraft, nextSelection);
    const compactValue = nextDraft.toCompactValue();
    const operation: TFormattedInputEditorOperation = {
      type: 'replaceRawRange',
      start: 0,
      end: state.getRawValue().length,
      text: compactValue,
    };
    const transaction = {
      before: state,
      command,
      operations: [operation],
      after,
      clipboardText: null,
    };

    if (nextDraft.isEmpty()) {
      this._draft = nextDraft;
      this._rawValue = '';

      return {
        changeValue: '',
        shouldNotifyChange: true,
        transaction,
      };
    }

    if (nextDraft.isComplete() && this._config.isDraftAllowed(nextDraft)) {
      const changeValue = this._config.createIsoValueFromDraft(nextDraft);

      this._draft = nextDraft;
      this._rawValue = changeValue;

      return {
        changeValue,
        shouldNotifyChange: true,
        transaction,
      };
    }

    this._draft = nextDraft;
    this._rawValue = currentRawValue;

    return {
      changeValue: null,
      shouldNotifyChange: false,
      transaction,
    };
  }

  private _createSelection(draft: FormattedInputDateDraft, rawOffset: number): FormattedInputSelection {
    return this._cursorMapper.createCollapsedSelection(draft, rawOffset);
  }

  private _createSelectionRange(
    draft: FormattedInputDateDraft,
    anchorRawOffset: number,
    focusRawOffset: number,
    anchorVisualOffset: number,
    focusVisualOffset: number,
    direction: FormattedInputSelection['direction'],
  ): FormattedInputSelection {
    if (anchorRawOffset === focusRawOffset) {
      return this._cursorMapper.createPointerSelection(
        draft,
        new FormattedInputSelection({
          anchor: this._createBoundaryCaret(focusRawOffset, focusVisualOffset),
          focus: this._createBoundaryCaret(focusRawOffset, focusVisualOffset),
          direction: 'none',
        }),
      );
    }

    return this._cursorMapper.createRangeSelection(
      new FormattedInputSelection({
        anchor: this._createBoundaryCaret(anchorRawOffset, anchorVisualOffset),
        focus: this._createBoundaryCaret(focusRawOffset, focusVisualOffset),
        direction,
      }),
    );
  }

  private _createBoundaryCaret(rawOffset: number, visualOffset: number): FormattedInputCaret {
    return new FormattedInputCaret({
      position: new FormattedInputPosition({
        rawOffset,
        visualOffset,
      }),
    });
  }

  private _createSelectionTransaction(
    state: FormattedInputEditorState,
    command: TFormattedInputEditorCommand,
    selection: FormattedInputSelection,
  ): IFormattedInputDateTransactionResult {
    const after = state.withSelection(selection);
    const operation: TFormattedInputEditorOperation = {
      type: 'setSelection',
      selection,
    };

    return {
      changeValue: null,
      shouldNotifyChange: false,
      transaction: {
        before: state,
        command,
        operations: [operation],
        after,
        clipboardText: null,
      },
    };
  }

  private _createSlotSymbol(
    token: IFormattedInputDateTimeSlotToken,
    value: string | undefined,
    visualOffset: number,
  ): FormattedInputSymbolConfig {
    const className = this._config.getSlotClassName(token, value !== void 0);

    if (value !== void 0) {
      return new FormattedInputSymbolConfig({
        id: `slot:${visualOffset}:${value}`,
        char: value,
        role: 'editable',
        style: this._createStyle(className),
      });
    }

    return new FormattedInputSymbolConfig({
      id: `placeholder:${visualOffset}:${this._config.slotPlaceholder}`,
      char: this._config.slotPlaceholder,
      role: 'placeholder',
      editable: true,
      removable: false,
      raw: false,
      style: this._createStyle(className),
    });
  }

  private _createState(rawValue: string, selection: FormattedInputSelection): FormattedInputEditorState {
    return this._createStateFromDraft(this._resolveDraft(rawValue), selection);
  }

  private _createStateFromDraft(
    draft: FormattedInputDateDraft,
    selection: FormattedInputSelection,
  ): FormattedInputEditorState {
    const normalizedSelection = this._createSelectionRange(
      draft,
      selection.anchor.position.rawOffset,
      selection.focus.position.rawOffset,
      selection.anchor.position.visualOffset,
      selection.focus.position.visualOffset,
      selection.direction,
    );

    return new FormattedInputEditorState({
      document: this._createDocument(draft),
      selection: normalizedSelection,
      composition: null,
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

  private _cutSelection(
    state: FormattedInputEditorState,
    command: TFormattedInputEditorCommand,
    currentRawValue: string,
  ): IFormattedInputDateTransactionResult {
    const clipboardText = this._extractSelectionText(state);
    const result = this._replaceSelection(state, command, currentRawValue, '', false);

    return {
      ...result,
      transaction: {
        ...result.transaction,
        clipboardText,
      },
    };
  }

  private _deleteBackward(
    state: FormattedInputEditorState,
    command: TFormattedInputEditorCommand,
    currentRawValue: string,
  ): IFormattedInputDateTransactionResult {
    if (!state.selection.isCollapsed()) {
      return this._replaceSelection(state, command, currentRawValue, '', false);
    }

    const offset = state.selection.focus.position.rawOffset;

    if (offset === 0) {
      return this._createNoopTransaction(state, command);
    }

    const draft = this._resolveDraft(currentRawValue);
    const result = this._editStrategy.deleteBackward(draft, state.selection);

    if (!result.changed) {
      const previousSection = this._cursorMapper.getAdjacentSection(state.selection, 'left');
      const moveResult = this._editStrategy.moveSection(draft, previousSection);

      if (moveResult !== null) {
        return this._createSelectionTransaction(
          state,
          command,
          this._cursorMapper.createCollapsedSelection(draft, moveResult.rawOffset, moveResult.section),
        );
      }

      return this._createNoopTransaction(state, command);
    }

    return this._createReplaceTransaction(
      state,
      command,
      currentRawValue,
      result.draft,
      this._cursorMapper.createCollapsedSelection(result.draft, result.rawOffset, result.section),
    );
  }

  private _deleteForward(
    state: FormattedInputEditorState,
    command: TFormattedInputEditorCommand,
  ): IFormattedInputDateTransactionResult {
    return this._createNoopTransaction(state, command);
  }

  private _dispatchCommand(
    command: TFormattedInputEditorCommand,
    state: FormattedInputEditorState | null,
    rawValue: string,
  ): IFormattedInputDateTransactionResult | null {
    if (state === null) {
      return null;
    }

    if (command.type === 'copySelection') {
      return this._copySelection(state, command);
    }

    if (command.type === 'cutSelection') {
      return this._cutSelection(state, command, rawValue);
    }

    if (command.type === 'deleteBackward') {
      return this._deleteBackward(state, command, rawValue);
    }

    if (command.type === 'deleteForward') {
      return this._deleteForward(state, command);
    }

    if (command.type === 'moveCaret') {
      return this._moveCaret(state, command, rawValue);
    }

    if (command.type === 'setSelection') {
      return this._setSelection(state, command, rawValue);
    }

    if (command.type === 'insertText') {
      return this._insertText(state, command, rawValue);
    }

    if (command.type === 'replaceSelection') {
      return this._replaceSelection(state, command, rawValue, command.text, false);
    }

    if (command.type === 'pasteText') {
      return this._replaceSelection(state, command, rawValue, command.text, true);
    }

    return null;
  }

  private _moveCaret(
    state: FormattedInputEditorState,
    command: Extract<TFormattedInputEditorCommand, { type: 'moveCaret' }>,
    rawValue: string,
  ): IFormattedInputDateTransactionResult {
    const draft = this._resolveDraft(rawValue);

    if (command.direction === 'start') {
      return this._createSelectionTransaction(state, command, this._createSelection(draft, 0));
    }

    if (command.direction === 'end') {
      return this._createSelectionTransaction(
        state,
        command,
        this._createSelection(draft, this._config.pattern.slotCount),
      );
    }

    const nextSection = this._cursorMapper.getAdjacentSection(state.selection, command.direction);
    const result = this._editStrategy.moveSection(draft, nextSection);

    if (result === null) {
      return this._createSelectionTransaction(state, command, state.selection);
    }

    return this._createSelectionTransaction(
      state,
      command,
      this._cursorMapper.createCollapsedSelection(draft, result.rawOffset, result.section),
    );
  }

  private _extractSelectionText(state: FormattedInputEditorState): string {
    const range = state.selection.getRawRange();

    return state.getRawValue().slice(range.start, range.end);
  }

  private _replaceRawRange(
    state: FormattedInputEditorState,
    command: TFormattedInputEditorCommand,
    currentRawValue: string,
    start: number,
    end: number,
    text: string,
    isPaste: boolean,
  ): IFormattedInputDateTransactionResult {
    const normalizedText = isPaste ? this._config.normalizePasteValue(text) : this._config.normalizeInsertValue(text);

    if (text.length > 0 && normalizedText.length === 0) {
      return this._createNoopTransaction(state, command);
    }

    const currentDraft = this._resolveDraft(currentRawValue);
    const candidate = currentDraft.replaceRange(start, end, normalizedText);

    if (!this._config.isDraftAllowed(candidate)) {
      return this._createNoopTransaction(state, command);
    }

    return this._createReplaceTransaction(
      state,
      command,
      currentRawValue,
      candidate,
      this._createSelectionAfterReplace(candidate, start, normalizedText.length),
    );
  }

  private _insertText(
    state: FormattedInputEditorState,
    command: Extract<TFormattedInputEditorCommand, { type: 'insertText' }>,
    currentRawValue: string,
  ): IFormattedInputDateTransactionResult {
    const normalizedText = this._config.normalizeInsertValue(command.text);

    if (normalizedText.length !== 1) {
      return this._createNoopTransaction(state, command);
    }

    const draft = this._resolveDraft(currentRawValue);
    const result = this._editStrategy.insertDigit(draft, state.selection, normalizedText);

    if (!result.changed) {
      return this._createNoopTransaction(state, command);
    }

    return this._createReplaceTransaction(
      state,
      command,
      currentRawValue,
      result.draft,
      this._cursorMapper.createCollapsedSelection(result.draft, result.rawOffset, result.section),
    );
  }

  private _replaceSelection(
    state: FormattedInputEditorState,
    command: TFormattedInputEditorCommand,
    currentRawValue: string,
    text: string,
    isPaste: boolean,
  ): IFormattedInputDateTransactionResult {
    const range = state.selection.getRawRange();

    return this._replaceRawRange(state, command, currentRawValue, range.start, range.end, text, isPaste);
  }

  private _resolveDraft(rawValue: string): FormattedInputDateDraft {
    if (this._draft === null || this._rawValue !== rawValue) {
      this._draft = this._config.createDraft(rawValue);
      this._rawValue = rawValue;
    }

    return this._draft;
  }

  private _setSelection(
    state: FormattedInputEditorState,
    command: Extract<TFormattedInputEditorCommand, { type: 'setSelection' }>,
    rawValue: string,
  ): IFormattedInputDateTransactionResult {
    const draft = this._resolveDraft(rawValue);

    if (this._shouldSelectFirstSectionOnInitialPointer(command, draft)) {
      const firstSection = this._config.sections[0];

      if (firstSection !== void 0) {
        return this._createSelectionTransaction(
          state,
          command,
          this._cursorMapper.createSectionSelection(draft, firstSection, firstSection.start),
        );
      }
    }

    if (this._shouldSelectAllSlotsOnKeyboardSelectAll(command, draft)) {
      return this._createSelectionTransaction(
        state,
        command,
        this._createSelectionRange(
          draft,
          0,
          this._config.pattern.slotCount,
          0,
          this._config.pattern.tokens.length,
          'forward',
        ),
      );
    }

    return this._createSelectionTransaction(
      state,
      command,
      this._createSetSelection(draft, command.selection),
    );
  }

  private _shouldSelectFirstSectionOnInitialPointer(
    command: Extract<TFormattedInputEditorCommand, { type: 'setSelection' }>,
    draft: FormattedInputDateDraft,
  ): boolean {
    return (
      command.source === 'pointer' &&
      command.hadFocus === false &&
      command.selection.isCollapsed() &&
      draft.isEmpty()
    );
  }

  private _shouldSelectAllSlotsOnKeyboardSelectAll(
    command: Extract<TFormattedInputEditorCommand, { type: 'setSelection' }>,
    draft: FormattedInputDateDraft,
  ): boolean {
    return (
      command.source === 'keyboard' &&
      command.selection.anchor.position.rawOffset === 0 &&
      command.selection.focus.position.rawOffset === 0 &&
      !draft.isEmpty()
    );
  }

  private _createSetSelection(
    draft: FormattedInputDateDraft,
    selection: FormattedInputSelection,
  ): FormattedInputSelection {
    if (selection.isCollapsed()) {
      return this._cursorMapper.createPointerSelection(draft, selection);
    }

    return this._createSelectionRange(
      draft,
      selection.anchor.position.rawOffset,
      selection.focus.position.rawOffset,
      selection.anchor.position.visualOffset,
      selection.focus.position.visualOffset,
      selection.direction,
    );
  }

  private _createSelectionAfterReplace(
    draft: FormattedInputDateDraft,
    start: number,
    textLength: number,
  ): FormattedInputSelection {
    const rawOffset = this._config.normalizeRawOffset(start + textLength);
    const section =
      textLength > 0
        ? this._config.getSectionForSlot(Math.min(rawOffset - 1, this._config.pattern.slotCount - 1))
        : this._config.getSectionForRawOffset(start);

    return this._cursorMapper.createCollapsedSelection(draft, rawOffset, section);
  }
}
