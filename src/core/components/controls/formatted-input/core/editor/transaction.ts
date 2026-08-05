import type { FormattedInputEditorState } from '../domain';
import type { TFormattedInputEditorCommand } from './command';
import type { TFormattedInputEditorOperation } from './operation';

export interface IFormattedInputTransactionResult {
  before: FormattedInputEditorState;
  command: TFormattedInputEditorCommand;
  operations: readonly TFormattedInputEditorOperation[];
  after: FormattedInputEditorState;
  clipboardText: string | null;
}
