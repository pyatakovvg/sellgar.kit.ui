import type { FormattedInputSelection } from '../domain';

export type TFormattedInputEditorOperation =
  | {
      type: 'replaceRawRange';
      start: number;
      end: number;
      text: string;
    }
  | {
      type: 'setSelection';
      selection: FormattedInputSelection;
    };
