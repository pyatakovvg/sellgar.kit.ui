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

import type {
  TFormattedInputCaretAffinity,
  IFormattedInputEditorTransactionResult,
  TFormattedInputEditorCommand,
  TFormattedInputEditorOperation,
} from '../../core';
import type { FormattedInputPluginContext, IFormattedInputPlugin } from '../plugin';
import { FormattedInputAmountConfig, type IFormattedInputAmountConfigOptions } from './amount-config';
import cn from 'classnames';

export interface IFormattedInputAmountPluginOptions extends IFormattedInputAmountConfigOptions {}

interface IFormattedInputAmountSymbolOptions {
  char: string;
  className?: string;
  displayChar?: string;
  editable: boolean;
  ordinal: number;
  raw: boolean;
  rawOffset: number | null;
  role: 'editable' | 'separator';
  visualOffset: number;
}

const DECIMAL_SEPARATOR = '.';
const GROUP_SEPARATOR = ' ';
const DISPLAY_DECIMAL_SEPARATOR = ',';
const INTEGER_GROUP_SIZE = 3;
const NEGATIVE_SIGN = '-';
const POSITIVE_SIGN = '+';

const createCaret = (
  rawOffset: number,
  visualOffset: number,
  affinity: TFormattedInputCaretAffinity,
): FormattedInputCaret =>
  new FormattedInputCaret({
    position: new FormattedInputPosition({
      affinity,
      rawOffset,
      visualOffset,
    }),
  });

const createAmountStyle = (className: string | undefined): { className?: string } | undefined => {
  if (className === void 0) {
    return void 0;
  }

  return {
    className,
  };
};

class FormattedInputAmountSymbolConfig extends FormattedInputSymbolConfig {
  private readonly _displayChar: string;

  constructor(options: IFormattedInputAmountSymbolOptions) {
    super({
      id: `symbol:${options.ordinal}`,
      char: options.char,
      role: options.role,
      editable: options.editable,
      raw: options.raw,
      style: createAmountStyle(options.className),
    });

    this._displayChar = options.displayChar ?? options.char;
  }

  override toDisplayText(): string {
    return this._displayChar;
  }
}

export class FormattedInputAmountPlugin implements IFormattedInputPlugin {
  readonly name: string;
  readonly priority?: number;
  private readonly _config: FormattedInputAmountConfig;

  constructor(options: IFormattedInputAmountPluginOptions = {}) {
    this._config = new FormattedInputAmountConfig(options);
    this.name = this._config.name;
    this.priority = this._config.priority;
  }

  execute(context: FormattedInputPluginContext): FormattedInputPluginContext {
    if (context.phase === 'createState') {
      return context.setState(
        this._createState(
          context.rawValue,
          context.selection ?? FormattedInputSelection.collapsed(context.rawOffset),
        ),
      );
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

    if (command.type === 'insertText' || command.type === 'replaceSelection') {
      return this._replaceSelection(state, command, command.text, false);
    }

    if (command.type === 'pasteText') {
      return this._replaceSelection(state, command, command.text, true);
    }

    return null;
  }

  private _createState(rawValue: string, selection: FormattedInputSelection): FormattedInputEditorState {
    const normalizedRawValue = this._config.normalizeEditValue(rawValue);
    const normalizedSelection = this._normalizeSelection(selection, normalizedRawValue);

    return new FormattedInputEditorState({
      document: this._createDocument(normalizedRawValue),
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
    const transaction = this._replaceSelection(state, command, '', false);

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
      return this._replaceSelection(state, command, '', false);
    }

    const offset = state.selection.focus.position.rawOffset;

    if (offset === 0) {
      return this._createNoopTransaction(state, command);
    }

    return this._replaceRawRange(state, command, offset - 1, offset, '', false);
  }

  private _deleteForward(
    state: FormattedInputEditorState,
    command: TFormattedInputEditorCommand,
  ): IFormattedInputEditorTransactionResult {
    if (!state.selection.isCollapsed()) {
      return this._replaceSelection(state, command, '', false);
    }

    const offset = state.selection.focus.position.rawOffset;

    if (offset >= state.getRawValue().length) {
      return this._createNoopTransaction(state, command);
    }

    const zeroFractionRange = this._getZeroFractionDeleteRange(state.getRawValue(), offset);

    if (zeroFractionRange !== null) {
      return this._replaceRawRange(state, command, zeroFractionRange.start, zeroFractionRange.end, '', false);
    }

    return this._replaceRawRange(state, command, offset, offset + 1, '', false);
  }

  private _moveCaret(
    state: FormattedInputEditorState,
    command: Extract<TFormattedInputEditorCommand, { type: 'moveCaret' }>,
  ): IFormattedInputEditorTransactionResult {
    const rawValue = state.getRawValue();
    const currentRawOffset = state.selection.focus.position.rawOffset;
    let nextRawOffset = currentRawOffset;

    if (command.direction === 'start') {
      nextRawOffset = 0;
    } else if (command.direction === 'end') {
      nextRawOffset = rawValue.length;
    } else if (command.direction === 'left') {
      nextRawOffset = currentRawOffset - 1;
    } else {
      nextRawOffset = currentRawOffset + 1;
    }

    return this._createSelectionTransaction(
      state,
      {
        type: 'setSelection',
        selection: this._createCollapsedSelection(rawValue, nextRawOffset),
      },
    );
  }

  private _setSelection(
    state: FormattedInputEditorState,
    command: Extract<TFormattedInputEditorCommand, { type: 'setSelection' }>,
  ): IFormattedInputEditorTransactionResult {
    return this._createSelectionTransaction(state, {
      type: 'setSelection',
      selection: this._normalizeSelection(command.selection, state.getRawValue()),
    });
  }

  private _replaceSelection(
    state: FormattedInputEditorState,
    command: TFormattedInputEditorCommand,
    text: string,
    isPaste: boolean,
  ): IFormattedInputEditorTransactionResult {
    if (!isPaste && this._isSignText(text)) {
      return this._replaceSign(state, command, text);
    }

    const range = state.selection.getRawRange();

    return this._replaceRawRange(state, command, range.start, range.end, text, isPaste);
  }

  private _replaceSign(
    state: FormattedInputEditorState,
    command: TFormattedInputEditorCommand,
    sign: string,
  ): IFormattedInputEditorTransactionResult {
    if (sign === NEGATIVE_SIGN) {
      return this._applyNegativeSign(state, command);
    }

    return this._applyPositiveSign(state, command);
  }

  private _applyNegativeSign(
    state: FormattedInputEditorState,
    command: TFormattedInputEditorCommand,
  ): IFormattedInputEditorTransactionResult {
    if (!this._config.allowNegative) {
      return this._createNoopTransaction(state, command);
    }

    const rawValue = state.getRawValue();
    const currentSign = this._getRawSign(rawValue);

    if (currentSign === NEGATIVE_SIGN) {
      return this._applyPositiveSign(state, command);
    }

    const range = state.selection.getRawRange();
    const unsignedRawValue = currentSign === null ? rawValue : rawValue.slice(1);
    const nextRawValue = `${NEGATIVE_SIGN}${unsignedRawValue}`;
    const nextRawOffset =
      currentSign === null ? state.selection.focus.position.rawOffset + 1 : state.selection.focus.position.rawOffset;

    if (!this._config.isRawValueAllowed(nextRawValue)) {
      return this._createNoopTransaction(state, command);
    }

    return this._createReplaceTransaction(
      state,
      command,
      currentSign === null ? range.start : 0,
      currentSign === null ? range.end : 1,
      nextRawValue,
      this._normalizeRawOffset(nextRawOffset, nextRawValue),
    );
  }

  private _applyPositiveSign(
    state: FormattedInputEditorState,
    command: TFormattedInputEditorCommand,
  ): IFormattedInputEditorTransactionResult {
    const rawValue = state.getRawValue();

    if (!rawValue.startsWith(NEGATIVE_SIGN)) {
      return this._createNoopTransaction(state, command);
    }

    const nextRawValue = rawValue.slice(1);
    const nextRawOffset = Math.max(0, state.selection.focus.position.rawOffset - 1);

    return this._createReplaceTransaction(
      state,
      command,
      0,
      1,
      nextRawValue,
      this._normalizeRawOffset(nextRawOffset, nextRawValue),
    );
  }

  private _replaceRawRange(
    state: FormattedInputEditorState,
    command: TFormattedInputEditorCommand,
    start: number,
    end: number,
    text: string,
    isPaste: boolean,
  ): IFormattedInputEditorTransactionResult {
    const rawValue = state.getRawValue();
    const normalizedText = isPaste ? this._config.normalizePasteValue(text) : text;

    if (isPaste && normalizedText.length === 0 && text.length > 0) {
      return this._createNoopTransaction(state, command);
    }

    const candidate = `${rawValue.slice(0, start)}${normalizedText}${rawValue.slice(end)}`;
    const nextRawValue = this._config.normalizeEditValue(candidate);

    if (!this._config.isRawValueAllowed(nextRawValue)) {
      return this._createNoopTransaction(state, command);
    }

    const targetOffset = start + normalizedText.length;
    const nextRawOffset = this._normalizeRawOffset(
      this._config.normalizeEditValue(candidate.slice(0, targetOffset)).length,
      nextRawValue,
    );

    return this._createReplaceTransaction(state, command, start, end, nextRawValue, nextRawOffset);
  }

  private _createReplaceTransaction(
    state: FormattedInputEditorState,
    command: TFormattedInputEditorCommand,
    start: number,
    end: number,
    nextRawValue: string,
    nextRawOffset: number,
  ): IFormattedInputEditorTransactionResult {
    const after = this._createState(nextRawValue, this._createCollapsedSelection(nextRawValue, nextRawOffset));
    const operation: TFormattedInputEditorOperation = {
      type: 'replaceRawRange',
      start,
      end,
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
    command: Extract<TFormattedInputEditorCommand, { type: 'setSelection' }>,
  ): IFormattedInputEditorTransactionResult {
    const after = state.withSelection(command.selection);
    const operation: TFormattedInputEditorOperation = {
      type: 'setSelection',
      selection: command.selection,
    };

    return {
      before: state,
      command,
      operations: [operation],
      after,
      clipboardText: null,
    };
  }

  private _getRawSign(rawValue: string): string | null {
    if (rawValue.startsWith(NEGATIVE_SIGN)) {
      return NEGATIVE_SIGN;
    }

    if (rawValue.startsWith(POSITIVE_SIGN)) {
      return POSITIVE_SIGN;
    }

    return null;
  }

  private _isSignText(text: string): boolean {
    return text === NEGATIVE_SIGN || text === POSITIVE_SIGN;
  }

  private _getZeroFractionDeleteRange(rawValue: string, offset: number): { end: number; start: number } | null {
    if (rawValue[offset] !== '0' || rawValue[offset + 1] !== DECIMAL_SEPARATOR) {
      return null;
    }

    return {
      start: offset + 1,
      end: rawValue.length,
    };
  }

  private _getRawSymbolClassName(
    char: string,
    rawOffset: number,
    decimalIndex: number,
    integerEndIndex: number,
  ): string | undefined {
    if (char === NEGATIVE_SIGN) {
      return cn(this._config.symbolClassNames.sign, this._config.symbolClassNames.negativeSign) || void 0;
    }

    if (char === POSITIVE_SIGN) {
      return cn(this._config.symbolClassNames.sign, this._config.symbolClassNames.positiveSign) || void 0;
    }

    if (char === DECIMAL_SEPARATOR) {
      return this._config.symbolClassNames.decimalSeparator;
    }

    if (decimalIndex !== -1 && rawOffset > decimalIndex) {
      return this._config.symbolClassNames.fraction;
    }

    if (rawOffset < integerEndIndex) {
      return this._config.symbolClassNames.integer;
    }

    return void 0;
  }

  private _createDocument(rawValue: string): FormattedInputDocument {
    const groupId = 'group:0';
    const lineId = 'line:0';
    const symbols = this._createSymbols(rawValue).map(
      (options) =>
        new FormattedInputSymbolNode({
          symbol: new FormattedInputAmountSymbolConfig(options),
          lineId,
          groupId,
          ordinal: options.ordinal,
          rawOffset: options.rawOffset,
          visualOffset: options.visualOffset,
        }),
    );
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

  private _createSymbols(rawValue: string): readonly IFormattedInputAmountSymbolOptions[] {
    const decimalIndex = rawValue.indexOf(DECIMAL_SEPARATOR);
    const integerEndIndex = decimalIndex === -1 ? rawValue.length : decimalIndex;
    const result: IFormattedInputAmountSymbolOptions[] = [];
    let integerDigitIndex = 0;
    let ordinal = 0;
    let visualOffset = 0;

    for (let rawOffset = 0; rawOffset < rawValue.length; rawOffset++) {
      const char = rawValue[rawOffset];
      const isIntegerDigit = rawOffset < integerEndIndex && char >= '0' && char <= '9';

      if (isIntegerDigit && this._shouldInsertGroupSeparator(rawValue, rawOffset, integerEndIndex, integerDigitIndex)) {
        result.push({
          char: GROUP_SEPARATOR,
          className: this._config.symbolClassNames.groupSeparator,
          editable: false,
          ordinal,
          raw: false,
          rawOffset: null,
          role: 'separator',
          visualOffset,
        });
        ordinal++;
        visualOffset++;
      }

      result.push({
        char,
        className: this._getRawSymbolClassName(char, rawOffset, decimalIndex, integerEndIndex),
        displayChar: char === DECIMAL_SEPARATOR ? DISPLAY_DECIMAL_SEPARATOR : char,
        editable: true,
        ordinal,
        raw: true,
        rawOffset,
        role: 'editable',
        visualOffset,
      });
      ordinal++;
      visualOffset++;

      if (isIntegerDigit) {
        integerDigitIndex++;
      }
    }

    return result;
  }

  private _shouldInsertGroupSeparator(
    rawValue: string,
    rawOffset: number,
    integerEndIndex: number,
    integerDigitIndex: number,
  ): boolean {
    if (integerDigitIndex === 0) {
      return false;
    }

    const integerDigitCount = this._countIntegerDigits(rawValue, integerEndIndex);
    const remainingDigits = integerDigitCount - integerDigitIndex;

    return remainingDigits > 0 && remainingDigits % INTEGER_GROUP_SIZE === 0;
  }

  private _countIntegerDigits(rawValue: string, integerEndIndex: number): number {
    let count = 0;

    for (let index = 0; index < integerEndIndex; index++) {
      const char = rawValue[index];

      if (char >= '0' && char <= '9') {
        count++;
      }
    }

    return count;
  }

  private _getVisualOffsetForRawOffset(rawValue: string, rawOffset: number): number {
    return this._getCaretPositionForRawOffset(rawValue, rawOffset).visualOffset;
  }

  private _getCaretPositionForRawOffset(
    rawValue: string,
    rawOffset: number,
  ): { affinity: TFormattedInputCaretAffinity; visualOffset: number } {
    const normalizedRawOffset = this._normalizeRawOffset(rawOffset, rawValue);
    const symbols = this._createSymbols(rawValue);

    for (const symbol of symbols) {
      if (symbol.rawOffset !== null && symbol.rawOffset === normalizedRawOffset) {
        return {
          affinity: 'before',
          visualOffset: symbol.visualOffset,
        };
      }
    }

    const lastSymbol = symbols[symbols.length - 1];

    if (lastSymbol === void 0) {
      return {
        affinity: 'after',
        visualOffset: 0,
      };
    }

    return {
      affinity: 'after',
      visualOffset: lastSymbol.visualOffset,
    };
  }

  private _createCollapsedSelection(rawValue: string, rawOffset: number): FormattedInputSelection {
    const caret = this._createCaret(rawValue, rawOffset);

    return new FormattedInputSelection({
      anchor: caret,
      focus: caret,
      direction: 'none',
    });
  }

  private _createCaret(rawValue: string, rawOffset: number): FormattedInputCaret {
    const normalizedRawOffset = this._normalizeRawOffset(rawOffset, rawValue);
    const position = this._getCaretPositionForRawOffset(rawValue, normalizedRawOffset);

    return createCaret(normalizedRawOffset, position.visualOffset, position.affinity);
  }

  private _normalizeSelection(selection: FormattedInputSelection, rawValue: string): FormattedInputSelection {
    return new FormattedInputSelection({
      anchor: this._createCaret(rawValue, selection.anchor.position.rawOffset),
      focus: this._createCaret(rawValue, selection.focus.position.rawOffset),
      direction: selection.direction,
    });
  }

  private _normalizeRawOffset(rawOffset: number, rawValue: string): number {
    if (rawOffset < 0) {
      return 0;
    }

    if (rawOffset > rawValue.length) {
      return rawValue.length;
    }

    return rawOffset;
  }

  private _extractSelectionText(state: FormattedInputEditorState): string {
    const range = state.selection.getRawRange();

    return state.getRawValue().slice(range.start, range.end);
  }
}
