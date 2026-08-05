import { createFormattedInputIdentityDocument } from './document';
import { clampFormattedInputOffset, FormattedInputPosition } from './position';
import { FormattedInputCaret } from './caret';
import { FormattedInputSelection } from './selection';

import type { FormattedInputDocument } from './document';

export interface IFormattedInputEditorStateOptions {
  document: FormattedInputDocument;
  selection: FormattedInputSelection;
  composition: string | null;
}

export class FormattedInputEditorState {
  readonly document: FormattedInputDocument;
  readonly selection: FormattedInputSelection;
  readonly composition: string | null;

  constructor(options: IFormattedInputEditorStateOptions) {
    this.document = options.document;
    this.selection = options.selection;
    this.composition = options.composition;
  }

  getRawValue(): string {
    return this.document.getRawValue();
  }

  getDisplayValue(): string {
    return this.document.getDisplayValue();
  }

  withSelection(selection: FormattedInputSelection): FormattedInputEditorState {
    return new FormattedInputEditorState({
      document: this.document,
      selection,
      composition: this.composition,
    });
  }
}

export const createFormattedInputEditorState = (
  rawValue: string,
  rawOffset = rawValue.length,
): FormattedInputEditorState => {
  const document = createFormattedInputIdentityDocument(rawValue);
  const normalizedOffset = clampFormattedInputOffset(rawOffset, rawValue);
  const position = new FormattedInputPosition({
    rawOffset: normalizedOffset,
  });
  const caret = new FormattedInputCaret({
    position,
  });

  return new FormattedInputEditorState({
    document,
    selection: new FormattedInputSelection({
      anchor: caret,
      focus: caret,
      direction: 'none',
    }),
    composition: null,
  });
};
