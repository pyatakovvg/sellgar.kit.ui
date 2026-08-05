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
import {
  FORMATTED_INPUT_MASK_DIGIT_RULE,
  FormattedInputMaskRegExpRule,
} from '../mask';

import type {
  IFormattedInputEditorTransactionResult,
  TFormattedInputCaretAffinity,
  TFormattedInputEditorCommand,
  TFormattedInputEditorOperation,
} from '../../core';
import type { FormattedInputPluginContext, IFormattedInputPlugin } from '../plugin';
import type { IFormattedInputMaskSlotRule, TFormattedInputMaskSlotRuleSource } from '../mask';

import cn from 'classnames';

export interface IFormattedInputOtpSymbolClassNames {
  active?: string;
  cell?: string;
  empty?: string;
  filled?: string;
}

export interface IFormattedInputOtpPluginOptions {
  length?: number;
  name?: string;
  priority?: number;
  rule?: TFormattedInputMaskSlotRuleSource;
  symbolClassNames?: IFormattedInputOtpSymbolClassNames;
}

interface IFormattedInputOtpSymbolOptions {
  active: boolean;
  char: string;
  filled: boolean;
  index: number;
  raw: boolean;
  rawOffset: number;
  symbolClassNames: IFormattedInputOtpSymbolClassNames;
}

const DEFAULT_LENGTH = 6;
const EMPTY_CELL_CHAR = ' ';

const normalizeLength = (length: number | undefined): number =>
  typeof length === 'number' && Number.isFinite(length) && length > 0 ? Math.floor(length) : DEFAULT_LENGTH;

const createCaret = (
  rawOffset: number,
  length: number,
  affinity: TFormattedInputCaretAffinity = rawOffset >= length ? 'after' : 'before',
): FormattedInputCaret => {
  const visualOffset = length === 0 ? 0 : Math.min(rawOffset, length - 1);

  return new FormattedInputCaret({
    position: new FormattedInputPosition({
      affinity,
      rawOffset,
      visualOffset,
    }),
  });
};

class FormattedInputOtpSymbolConfig extends FormattedInputSymbolConfig {
  private readonly _displayChar: string;

  constructor(options: IFormattedInputOtpSymbolOptions) {
    super({
      id: `otp:${options.index}`,
      char: options.char,
      role: options.filled ? 'editable' : 'placeholder',
      hitMode: 'cell',
      editable: true,
      raw: options.raw,
      style: {
        className: cn(
          options.symbolClassNames.cell,
          options.filled ? options.symbolClassNames.filled : options.symbolClassNames.empty,
          options.active && options.symbolClassNames.active,
        ) || void 0,
      },
    });

    this._displayChar = options.char;
  }

  override toDisplayText(): string {
    return this._displayChar;
  }
}

export class FormattedInputOtpPlugin implements IFormattedInputPlugin {
  readonly name: string;
  readonly priority?: number;
  private readonly _length: number;
  private readonly _rule: IFormattedInputMaskSlotRule;
  private readonly _symbolClassNames: IFormattedInputOtpSymbolClassNames;

  constructor(options: IFormattedInputOtpPluginOptions = {}) {
    this.name = options.name ?? 'otp';
    this.priority = options.priority;
    this._length = normalizeLength(options.length);
    this._rule = this._createRule(options.rule ?? FORMATTED_INPUT_MASK_DIGIT_RULE);
    this._symbolClassNames = options.symbolClassNames ?? {};
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

    if (command.type === 'insertText' || command.type === 'replaceSelection' || command.type === 'pasteText') {
      return this._replaceSelection(state, command, command.text);
    }

    return null;
  }

  private _createState(rawValue: string, selection: FormattedInputSelection): FormattedInputEditorState {
    const normalizedRawValue = this._normalizeRawValue(rawValue);
    const normalizedSelection = this._normalizeSelection(selection, normalizedRawValue);

    return new FormattedInputEditorState({
      document: this._createDocument(normalizedRawValue, normalizedSelection),
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

    const offset = state.selection.focus.position.rawOffset;
    const rawValue = state.getRawValue();

    if (offset < rawValue.length) {
      return this._replaceRawRange(state, command, offset, offset + 1, '', Math.max(0, offset - 1));
    }

    if (offset === 0) {
      return this._createNoopTransaction(state, command);
    }

    if (rawValue.length === this._length) {
      return this._replaceRawRange(state, command, offset - 1, offset, '', Math.max(0, offset - 2));
    }

    return this._replaceRawRange(state, command, offset - 1, offset, '', Math.max(0, offset - 1));
  }

  private _deleteForward(
    state: FormattedInputEditorState,
    command: TFormattedInputEditorCommand,
  ): IFormattedInputEditorTransactionResult {
    if (!state.selection.isCollapsed()) {
      return this._replaceSelection(state, command, '');
    }

    const offset = state.selection.focus.position.rawOffset;

    if (offset >= state.getRawValue().length) {
      return this._createNoopTransaction(state, command);
    }

    return this._replaceRawRange(state, command, offset, offset + 1, '');
  }

  private _moveCaret(
    state: FormattedInputEditorState,
    command: TFormattedInputEditorCommand,
  ): IFormattedInputEditorTransactionResult {
    if (command.type !== 'moveCaret') {
      return this._createNoopTransaction(state, command);
    }

    const rawLength = state.getRawValue().length;
    const currentOffset = state.selection.focus.position.rawOffset;
    let nextOffset = currentOffset;

    if (command.direction === 'start') {
      nextOffset = 0;
    } else if (command.direction === 'end') {
      nextOffset = rawLength;
    } else if (command.direction === 'left') {
      nextOffset = currentOffset - 1;
    } else {
      nextOffset = currentOffset + 1;
    }

    return this._createSelectionTransaction(state, command, this._createCollapsedSelection(nextOffset, rawLength));
  }

  private _setSelection(
    state: FormattedInputEditorState,
    command: TFormattedInputEditorCommand,
  ): IFormattedInputEditorTransactionResult {
    if (command.type !== 'setSelection') {
      return this._createNoopTransaction(state, command);
    }

    return this._createSelectionTransaction(
      state,
      command,
      this._normalizeSelection(command.selection, state.getRawValue()),
    );
  }

  private _replaceSelection(
    state: FormattedInputEditorState,
    command: TFormattedInputEditorCommand,
    text: string,
  ): IFormattedInputEditorTransactionResult {
    const range = state.selection.getRawRange();

    if (state.selection.isCollapsed()) {
      const replacementLength = this._normalizeRawValue(text).length;

      if (replacementLength > 0) {
        return this._replaceRawRange(
          state,
          command,
          range.start,
          Math.min(range.start + replacementLength, state.getRawValue().length),
          text,
        );
      }
    }

    return this._replaceRawRange(state, command, range.start, range.end, text);
  }

  private _replaceRawRange(
    state: FormattedInputEditorState,
    command: TFormattedInputEditorCommand,
    start: number,
    end: number,
    text: string,
    nextRawOffset?: number,
  ): IFormattedInputEditorTransactionResult {
    const rawValue = state.getRawValue();
    const normalizedStart = this._normalizeRawOffset(start, rawValue);
    const normalizedEnd = Math.max(normalizedStart, this._normalizeRawOffset(end, rawValue));
    const normalizedText = this._normalizeRawValue(text);
    const capacity = this._length - normalizedStart + (normalizedEnd - normalizedStart);
    const insertText = normalizedText.slice(0, Math.max(0, capacity));
    const nextRawValue = `${rawValue.slice(0, normalizedStart)}${insertText}${rawValue.slice(normalizedEnd)}`.slice(
      0,
      this._length,
    );
    const nextOffset = nextRawOffset ?? normalizedStart + insertText.length;
    const selection = this._createCollapsedSelection(nextOffset, nextRawValue.length);
    const after = this._createState(nextRawValue, selection);
    const operations: TFormattedInputEditorOperation[] =
      normalizedStart === normalizedEnd && insertText.length === 0
        ? []
        : [
            {
              type: 'replaceRawRange',
              start: normalizedStart,
              end: normalizedEnd,
              text: insertText,
            },
          ];

    return {
      before: state,
      command,
      operations,
      after,
      clipboardText: null,
    };
  }

  private _createSelectionTransaction(
    state: FormattedInputEditorState,
    command: TFormattedInputEditorCommand,
    selection: FormattedInputSelection,
  ): IFormattedInputEditorTransactionResult {
    const after = this._createState(state.getRawValue(), selection);

    return {
      before: state,
      command,
      operations: [
        {
          type: 'setSelection',
          selection: after.selection,
        },
      ],
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

  private _createDocument(rawValue: string, selection: FormattedInputSelection): FormattedInputDocument {
    const symbols: FormattedInputSymbolNode[] = [];
    const activeIndex = this._getActiveIndex(selection);

    for (let index = 0; index < this._length; index++) {
      const value = rawValue[index];
      const filled = value !== void 0;
      const symbol = new FormattedInputOtpSymbolConfig({
        active: activeIndex === index,
        char: filled ? value : EMPTY_CELL_CHAR,
        filled,
        index,
        raw: filled,
        rawOffset: index,
        symbolClassNames: this._symbolClassNames,
      });

      symbols.push(
        new FormattedInputSymbolNode({
          symbol,
          lineId: 'line:0',
          groupId: 'group:0',
          ordinal: index,
          rawOffset: index,
          visualOffset: index,
        }),
      );
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

  private _normalizeRawValue(value: string): string {
    const chars: string[] = [];

    for (const char of value) {
      if (this._rule.accepts(char)) {
        chars.push(char);
      }

      if (chars.length >= this._length) {
        break;
      }
    }

    return chars.join('');
  }

  private _normalizeSelection(selection: FormattedInputSelection, rawValue: string): FormattedInputSelection {
    if (selection.isCollapsed()) {
      return this._createCollapsedSelection(selection.focus.position.rawOffset, rawValue.length);
    }

    const anchorRawOffset = this._normalizeRawOffset(selection.anchor.position.rawOffset, rawValue);
    const focusRawOffset = this._normalizeRawOffset(selection.focus.position.rawOffset, rawValue);
    const anchor = createCaret(anchorRawOffset, this._length);
    const focus = createCaret(focusRawOffset, this._length);

    return new FormattedInputSelection({
      anchor,
      focus,
      direction: selection.direction,
    });
  }

  private _createCollapsedSelection(rawOffset: number, rawLength: number): FormattedInputSelection {
    const normalizedOffset = this._normalizeRawOffset(rawOffset, rawLength);
    const caret = createCaret(normalizedOffset, this._length);

    return new FormattedInputSelection({
      anchor: caret,
      focus: caret,
      direction: 'none',
    });
  }

  private _normalizeRawOffset(offset: number, rawValueOrLength: number | string): number {
    const rawLength = typeof rawValueOrLength === 'number' ? rawValueOrLength : rawValueOrLength.length;

    if (offset < 0) {
      return 0;
    }

    if (offset > rawLength) {
      return rawLength;
    }

    return offset;
  }

  private _getActiveIndex(selection: FormattedInputSelection): number | null {
    if (!selection.isCollapsed() || this._length === 0) {
      return null;
    }

    return Math.min(selection.focus.position.rawOffset, this._length - 1);
  }

  private _extractSelectionText(state: FormattedInputEditorState): string {
    const range = state.selection.getRawRange();

    return state.getRawValue().slice(range.start, range.end);
  }

  private _createRule(rule: TFormattedInputMaskSlotRuleSource): IFormattedInputMaskSlotRule {
    if (!(rule instanceof RegExp)) {
      return rule;
    }

    return new FormattedInputMaskRegExpRule({
      name: rule.source,
      pattern: rule,
    });
  }
}
