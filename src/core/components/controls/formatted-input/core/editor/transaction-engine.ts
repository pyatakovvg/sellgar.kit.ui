import { FormattedInputEditorState, createFormattedInputEditorState } from '../domain';
import { FormattedInputSelectionService } from './selection-service';

import type { TFormattedInputEditorCommand } from './command';
import type { TFormattedInputEditorOperation } from './operation';
import type { IFormattedInputTransactionResult } from './transaction';

export class FormattedInputTransactionEngine {
  private readonly _selectionService: FormattedInputSelectionService;

  constructor(selectionService = new FormattedInputSelectionService()) {
    this._selectionService = selectionService;
  }

  dispatch(state: FormattedInputEditorState, command: TFormattedInputEditorCommand): IFormattedInputTransactionResult {
    if (command.type === 'setSelection') {
      return this._createSelectionTransaction(state, command);
    }

    if (command.type === 'moveCaret') {
      const selection = this._selectionService.moveCaret(state, command.direction);

      return this._createSelectionTransaction(state, {
        type: 'setSelection',
        selection,
      });
    }

    if (command.type === 'copySelection') {
      return {
        before: state,
        command,
        operations: [],
        after: state,
        clipboardText: this._extractSelectionText(state),
      };
    }

    if (command.type === 'cutSelection') {
      const clipboardText = this._extractSelectionText(state);
      const result = this._replaceSelection(state, command, '');

      return {
        ...result,
        clipboardText,
      };
    }

    if (command.type === 'deleteBackward') {
      return this._deleteBackward(state, command);
    }

    if (command.type === 'deleteForward') {
      return this._deleteForward(state, command);
    }

    if (command.type === 'insertText' || command.type === 'pasteText') {
      return this._replaceSelection(state, command, command.text);
    }

    return this._replaceSelection(state, command, command.text);
  }

  private _createSelectionTransaction(
    state: FormattedInputEditorState,
    command: Extract<TFormattedInputEditorCommand, { type: 'setSelection' }>,
  ): IFormattedInputTransactionResult {
    const selection = this._selectionService.normalizeSelection(state, command.selection);
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

  private _deleteBackward(state: FormattedInputEditorState, command: TFormattedInputEditorCommand): IFormattedInputTransactionResult {
    if (!state.selection.isCollapsed()) {
      return this._replaceSelection(state, command, '');
    }

    const offset = state.selection.focus.position.rawOffset;

    if (offset === 0) {
      return this._createNoopTransaction(state, command);
    }

    return this._replaceRawRange(state, command, offset - 1, offset, '');
  }

  private _deleteForward(state: FormattedInputEditorState, command: TFormattedInputEditorCommand): IFormattedInputTransactionResult {
    if (!state.selection.isCollapsed()) {
      return this._replaceSelection(state, command, '');
    }

    const rawValue = state.getRawValue();
    const offset = state.selection.focus.position.rawOffset;

    if (offset >= rawValue.length) {
      return this._createNoopTransaction(state, command);
    }

    return this._replaceRawRange(state, command, offset, offset + 1, '');
  }

  private _replaceSelection(state: FormattedInputEditorState, command: TFormattedInputEditorCommand, text: string): IFormattedInputTransactionResult {
    const range = state.selection.getRawRange();

    return this._replaceRawRange(state, command, range.start, range.end, text);
  }

  private _replaceRawRange(
    state: FormattedInputEditorState,
    command: TFormattedInputEditorCommand,
    start: number,
    end: number,
    text: string,
  ): IFormattedInputTransactionResult {
    const rawValue = state.getRawValue();
    const nextRawValue = `${rawValue.slice(0, start)}${text}${rawValue.slice(end)}`;
    const nextOffset = start + text.length;
    const after = createFormattedInputEditorState(nextRawValue, nextOffset);
    const operation: TFormattedInputEditorOperation = {
      type: 'replaceRawRange',
      start,
      end,
      text,
    };

    return {
      before: state,
      command,
      operations: [operation],
      after,
      clipboardText: null,
    };
  }

  private _createNoopTransaction(state: FormattedInputEditorState, command: TFormattedInputEditorCommand): IFormattedInputTransactionResult {
    return {
      before: state,
      command,
      operations: [],
      after: state,
      clipboardText: null,
    };
  }

  private _extractSelectionText(state: FormattedInputEditorState): string {
    const range = state.selection.getRawRange();

    return state.getRawValue().slice(range.start, range.end);
  }
}
