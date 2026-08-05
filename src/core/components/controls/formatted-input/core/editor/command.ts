import type { FormattedInputSelection } from '../domain';

export type TFormattedInputMoveDirection = 'end' | 'left' | 'right' | 'start';
export type TFormattedInputSetSelectionSource = 'keyboard' | 'pointer' | 'programmatic';

export type TFormattedInputEditorCommand =
  | {
      type: 'insertText';
      text: string;
    }
  | {
      type: 'replaceSelection';
      text: string;
    }
  | {
      type: 'deleteBackward';
    }
  | {
      type: 'deleteForward';
    }
  | {
      type: 'pasteText';
      text: string;
    }
  | {
      type: 'copySelection';
    }
  | {
      type: 'cutSelection';
    }
  | {
      type: 'moveCaret';
      direction: TFormattedInputMoveDirection;
    }
  | {
      type: 'setSelection';
      hadFocus?: boolean;
      selection: FormattedInputSelection;
      source?: TFormattedInputSetSelectionSource;
    };
