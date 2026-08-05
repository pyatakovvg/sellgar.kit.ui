export {
  EMPTY_FORMATTED_INPUT_STYLE,
  FormattedInputCaret,
  FormattedInputDocument,
  FormattedInputEditorState,
  FormattedInputGroup,
  FormattedInputLine,
  FormattedInputPosition,
  FormattedInputSelection,
  FormattedInputSymbolConfig,
  FormattedInputSymbolNode,
  clampFormattedInputOffset,
  createFormattedInputEditorState,
  createFormattedInputIdentityDocument,
  mergeFormattedInputStyle,
} from './domain';
export {
  FormattedInputSelectionBoundaryResolver,
  FormattedInputSelectionService,
  FormattedInputTransactionEngine,
} from './editor';
export { FormattedInputWebProjectionBuilder } from './projection';
export type {
  IFormattedInputCaretOptions,
  IFormattedInputDocumentOptions,
  IFormattedInputEditorStateOptions,
  IFormattedInputGroupOptions,
  IFormattedInputInlineStyleConfig,
  IFormattedInputLineOptions,
  IFormattedInputPositionOptions,
  IFormattedInputRawRange as IFormattedInputDomainRawRange,
  IFormattedInputSelectionOptions,
  IFormattedInputStyleConfig,
  IFormattedInputSymbolConfigOptions,
  IFormattedInputSymbolNodeOptions,
  TFormattedInputCaretAffinity,
  TFormattedInputCssVars,
  TFormattedInputGroupRole,
  TFormattedInputSymbolRole,
} from './domain';
export type {
  IFormattedInputSelectionBoundaryContext,
  IFormattedInputSelectionBoundaryResolver,
  IFormattedInputTransactionResult as IFormattedInputEditorTransactionResult,
  TFormattedInputEditorCommand,
  TFormattedInputEditorOperation,
  TFormattedInputMoveDirection,
} from './editor';
export type {
  IFormattedInputCaretRenderBox,
  IFormattedInputLineRenderBox,
  IFormattedInputSelectionRenderBox,
  IFormattedInputSymbolRenderBox,
  IFormattedInputWebRenderModel,
} from './projection';
