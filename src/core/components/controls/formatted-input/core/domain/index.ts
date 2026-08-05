export { FormattedInputCaret } from './caret';
export { FormattedInputDocument, createFormattedInputIdentityDocument } from './document';
export { FormattedInputGroup } from './group';
export { FormattedInputLine } from './line';
export { FormattedInputPosition, clampFormattedInputOffset } from './position';
export { FormattedInputSelection } from './selection';
export { FormattedInputEditorState, createFormattedInputEditorState } from './state';
export { FormattedInputSymbolConfig, FormattedInputSymbolNode } from './symbol';
export { EMPTY_FORMATTED_INPUT_STYLE, mergeFormattedInputStyle } from './style';
export type { IFormattedInputCaretOptions } from './caret';
export type { IFormattedInputDocumentOptions } from './document';
export type { IFormattedInputGroupOptions, TFormattedInputGroupRole } from './group';
export type { IFormattedInputLineOptions } from './line';
export type { IFormattedInputPositionOptions, TFormattedInputCaretAffinity } from './position';
export type {
  IFormattedInputRawRange,
  IFormattedInputSelectionOptions,
  TFormattedInputSelectionDirection,
} from './selection';
export type { IFormattedInputEditorStateOptions } from './state';
export type {
  IFormattedInputSymbolConfigOptions,
  IFormattedInputSymbolNodeOptions,
  TFormattedInputSymbolHitMode,
  TFormattedInputSymbolRole,
} from './symbol';
export type { IFormattedInputInlineStyleConfig, IFormattedInputStyleConfig, TFormattedInputCssVars } from './style';
