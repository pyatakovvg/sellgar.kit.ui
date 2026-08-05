import type { TFormattedInputEditorCommand } from '../core';

export class FormattedInputKeyboardController {
  createCommand(event: KeyboardEvent): TFormattedInputEditorCommand | null {
    if (event.altKey || event.ctrlKey || event.metaKey || event.isComposing) {
      return null;
    }

    if (event.key === 'Backspace') {
      return {
        type: 'deleteBackward',
      };
    }

    if (event.key === 'Delete') {
      return {
        type: 'deleteForward',
      };
    }

    if (event.key === 'ArrowLeft') {
      return {
        type: 'moveCaret',
        direction: 'left',
      };
    }

    if (event.key === 'ArrowRight') {
      return {
        type: 'moveCaret',
        direction: 'right',
      };
    }

    if (event.key === 'Home') {
      return {
        type: 'moveCaret',
        direction: 'start',
      };
    }

    if (event.key === 'End') {
      return {
        type: 'moveCaret',
        direction: 'end',
      };
    }

    if (event.code === 'NumpadDecimal' || event.code === 'NumpadComma' || event.key === 'Decimal') {
      return {
        type: 'insertText',
        text: '.',
      };
    }

    if (event.key.length === 1) {
      return {
        type: 'insertText',
        text: event.key,
      };
    }

    return null;
  }
}
