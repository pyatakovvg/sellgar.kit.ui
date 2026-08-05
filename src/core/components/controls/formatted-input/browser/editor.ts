import {
  FormattedInputCaret,
  FormattedInputPosition,
  FormattedInputSelection,
  FormattedInputSelectionBoundaryResolver,
  FormattedInputSelectionService,
  FormattedInputTransactionEngine,
  FormattedInputWebProjectionBuilder,
  createFormattedInputEditorState,
} from '../core';
import { FormattedInputPluginContext, FormattedInputPluginPipeline } from '../plugins';
import { FormattedInputDomRenderer } from './dom-renderer';
import { FormattedInputKeyboardController } from './keyboard-controller';
import { FormattedInputPointerController } from './pointer-controller';

import type {
  FormattedInputEditorState,
  IFormattedInputEditorTransactionResult,
  IFormattedInputWebRenderModel,
  TFormattedInputEditorCommand,
} from '../core';
import type { FormattedInputPluginContext as TFormattedInputPluginContext, IFormattedInputPlugin } from '../plugins';
import type { IFormattedInputBrowserClassNames } from './class-names';
import type { IFormattedInputPointerHit } from './symbol-view';

const DOUBLE_CLICK_INTERVAL_MS = 500;

export interface IFormattedInputBrowserChangeMeta {
  transaction: IFormattedInputEditorTransactionResult;
  projection: IFormattedInputWebRenderModel;
}

export interface IFormattedInputBrowserEditorOptions {
  autoCapitalize?: string;
  autoCorrect?: string;
  autoFocus?: boolean;
  classNames: IFormattedInputBrowserClassNames;
  disabled?: boolean;
  enterKeyHint?: string;
  inputMode?: string;
  onChange?: (value: string, meta: IFormattedInputBrowserChangeMeta) => void;
  placeholder?: string;
  plugins?: readonly IFormattedInputPlugin[];
  readOnly?: boolean;
  root: HTMLElement;
  spellCheck?: boolean | string;
  value: string;
}

export interface IFormattedInputBrowserEditorUpdateOptions {
  autoCapitalize?: string;
  autoCorrect?: string;
  disabled?: boolean;
  enterKeyHint?: string;
  inputMode?: string;
  onChange?: (value: string, meta: IFormattedInputBrowserChangeMeta) => void;
  placeholder?: string;
  plugins?: readonly IFormattedInputPlugin[];
  readOnly?: boolean;
  spellCheck?: boolean | string;
  value: string;
}

export interface IFormattedInputInstance {
  blur(): void;

  copySelection(): string;

  cutSelection(): string;

  deleteBackward(): IFormattedInputEditorTransactionResult;

  deleteForward(): IFormattedInputEditorTransactionResult;

  dispatch(command: TFormattedInputEditorCommand): IFormattedInputEditorTransactionResult;

  focus(): void;

  getElement(): HTMLElement;

  getRawValue(): string;

  getSelection(): FormattedInputSelection;

  insertText(text: string): IFormattedInputEditorTransactionResult;

  pasteText(text: string): IFormattedInputEditorTransactionResult;

  setCaret(rawOffset: number): IFormattedInputEditorTransactionResult;

  setSelection(anchor: number, focus: number): IFormattedInputEditorTransactionResult;
}

interface IFormattedInputPointerDownSnapshot {
  symbolRawOffset: number | null;
  timeStamp: number;
}

interface IFormattedInputDispatchContext {
  context: TFormattedInputPluginContext;
  transaction: IFormattedInputEditorTransactionResult;
}

const createCaretAtRawOffset = (rawOffset: number, visualOffset = rawOffset): FormattedInputCaret =>
  new FormattedInputCaret({
    position: new FormattedInputPosition({
      rawOffset,
      visualOffset,
    }),
  });

const createSelection = (anchor: number, focus: number): FormattedInputSelection =>
  new FormattedInputSelection({
    anchor: createCaretAtRawOffset(anchor),
    focus: createCaretAtRawOffset(focus),
    direction: anchor > focus ? 'backward' : 'forward',
  });

const createCollapsedPointerSelection = (hit: IFormattedInputPointerHit): FormattedInputSelection => {
  const caret = createCaretAtRawOffset(hit.rawOffset, hit.visualOffset);

  return new FormattedInputSelection({
    anchor: caret,
    focus: caret,
    direction: 'none',
  });
};

const isMutationCommand = (command: TFormattedInputEditorCommand): boolean =>
  command.type === 'insertText' ||
  command.type === 'replaceSelection' ||
  command.type === 'deleteBackward' ||
  command.type === 'deleteForward' ||
  command.type === 'pasteText' ||
  command.type === 'cutSelection';

export class FormattedInputBrowserEditor implements IFormattedInputInstance {
  private readonly _root: HTMLElement;
  private readonly _renderer: FormattedInputDomRenderer;
  private readonly _keyboardController = new FormattedInputKeyboardController();
  private readonly _pointerController = new FormattedInputPointerController();
  private _pluginPipeline: FormattedInputPluginPipeline;
  private readonly _selectionBoundaryResolver = new FormattedInputSelectionBoundaryResolver();
  private readonly _selectionService = new FormattedInputSelectionService();
  private readonly _transactionEngine = new FormattedInputTransactionEngine(this._selectionService);
  private readonly _projectionBuilder = new FormattedInputWebProjectionBuilder();
  private _autoCapitalize: string | undefined;
  private _autoCorrect: string | undefined;
  private _autoFocus: boolean;
  private _disabled: boolean;
  private _dragAnchor: number | null = null;
  private _enterKeyHint: string | undefined;
  private _inputMode: string | undefined;
  private _lastPointerDown: IFormattedInputPointerDownSnapshot | null = null;
  private _onChange: IFormattedInputBrowserEditorOptions['onChange'];
  private _placeholder: string | undefined;
  private _plugins: readonly IFormattedInputPlugin[] | undefined;
  private _readOnly: boolean;
  private _selection: FormattedInputSelection;
  private _spellCheck: boolean | string | undefined;
  private _value: string;

  constructor(options: IFormattedInputBrowserEditorOptions) {
    this._root = options.root;
    this._value = options.value;
    this._placeholder = options.placeholder;
    this._disabled = options.disabled === true;
    this._readOnly = options.readOnly === true;
    this._autoCapitalize = options.autoCapitalize;
    this._autoCorrect = options.autoCorrect;
    this._autoFocus = options.autoFocus === true;
    this._enterKeyHint = options.enterKeyHint;
    this._inputMode = options.inputMode;
    this._onChange = options.onChange;
    this._plugins = options.plugins;
    this._spellCheck = options.spellCheck;
    this._selection = FormattedInputSelection.collapsed(options.value.length);
    this._pluginPipeline = new FormattedInputPluginPipeline(options.plugins);
    this._renderer = new FormattedInputDomRenderer(options.root, options.classNames);

    this._root.addEventListener('keydown', this._handleKeyDown);
    this._root.addEventListener('paste', this._handlePaste);
    this._root.addEventListener('copy', this._handleCopy);
    this._root.addEventListener('cut', this._handleCut);
    this._root.addEventListener('beforeinput', this._handleBeforeInput);
    this._root.addEventListener('input', this._handleInput);
    this._root.addEventListener('pointerdown', this._handlePointerDown);
    this._root.addEventListener('pointermove', this._handlePointerMove);
    this._root.addEventListener('pointerup', this._handlePointerUp);
    this._root.addEventListener('contextmenu', this._handleContextMenu);
    this._root.addEventListener('dblclick', this._handleDoubleClick);
    this._root.addEventListener('focus', this._handleFocus);
    this._root.addEventListener('blur', this._handleBlur);

    this._applyAttributes();
    this._render();
    this._applyAutoFocus();
  }

  destroy(): void {
    this._root.removeEventListener('keydown', this._handleKeyDown);
    this._root.removeEventListener('paste', this._handlePaste);
    this._root.removeEventListener('copy', this._handleCopy);
    this._root.removeEventListener('cut', this._handleCut);
    this._root.removeEventListener('beforeinput', this._handleBeforeInput);
    this._root.removeEventListener('input', this._handleInput);
    this._root.removeEventListener('pointerdown', this._handlePointerDown);
    this._root.removeEventListener('pointermove', this._handlePointerMove);
    this._root.removeEventListener('pointerup', this._handlePointerUp);
    this._root.removeEventListener('contextmenu', this._handleContextMenu);
    this._root.removeEventListener('dblclick', this._handleDoubleClick);
    this._root.removeEventListener('focus', this._handleFocus);
    this._root.removeEventListener('blur', this._handleBlur);
    this._renderer.destroy();
  }

  blur(): void {
    this._root.blur();
  }

  copySelection(): string {
    const dispatchContext = this._createTransaction({
      type: 'copySelection',
    });

    return dispatchContext.transaction.clipboardText ?? '';
  }

  cutSelection(): string {
    const transaction = this._dispatch({
      type: 'cutSelection',
    });

    return transaction.clipboardText ?? '';
  }

  deleteBackward(): IFormattedInputEditorTransactionResult {
    return this._dispatch({
      type: 'deleteBackward',
    });
  }

  deleteForward(): IFormattedInputEditorTransactionResult {
    return this._dispatch({
      type: 'deleteForward',
    });
  }

  dispatch(command: TFormattedInputEditorCommand): IFormattedInputEditorTransactionResult {
    return this._dispatch(command);
  }

  focus(): void {
    this._root.focus();
  }

  getElement(): HTMLElement {
    return this._root;
  }

  getRawValue(): string {
    return this._value;
  }

  getSelection(): FormattedInputSelection {
    return this._selection;
  }

  insertText(text: string): IFormattedInputEditorTransactionResult {
    return this._dispatch({
      type: 'insertText',
      text,
    });
  }

  pasteText(text: string): IFormattedInputEditorTransactionResult {
    return this._dispatch({
      type: 'pasteText',
      text,
    });
  }

  setCaret(rawOffset: number): IFormattedInputEditorTransactionResult {
    return this.setSelection(rawOffset, rawOffset);
  }

  setSelection(anchor: number, focus: number): IFormattedInputEditorTransactionResult {
    return this._setSelection(anchor, focus);
  }

  update(options: IFormattedInputBrowserEditorUpdateOptions): void {
    const nextDisabled = options.disabled === true;
    const nextReadOnly = options.readOnly === true;
    const shouldUpdatePlugins = options.plugins !== this._plugins;
    const shouldApplyAttributes =
      nextDisabled !== this._disabled ||
      nextReadOnly !== this._readOnly ||
      options.autoCapitalize !== this._autoCapitalize ||
      options.autoCorrect !== this._autoCorrect ||
      options.enterKeyHint !== this._enterKeyHint ||
      options.inputMode !== this._inputMode ||
      options.spellCheck !== this._spellCheck;
    const shouldRender =
      options.value !== this._value || options.placeholder !== this._placeholder || shouldUpdatePlugins;

    this._value = options.value;
    this._placeholder = options.placeholder;
    this._disabled = nextDisabled;
    this._readOnly = nextReadOnly;
    this._autoCapitalize = options.autoCapitalize;
    this._autoCorrect = options.autoCorrect;
    this._enterKeyHint = options.enterKeyHint;
    this._inputMode = options.inputMode;
    this._onChange = options.onChange;
    this._spellCheck = options.spellCheck;

    if (shouldUpdatePlugins) {
      this._plugins = options.plugins;
      this._pluginPipeline = new FormattedInputPluginPipeline(options.plugins);
    }

    if (shouldRender) {
      this._selection = this._selectionService.normalizeSelection(this._createState(), this._selection);
    }

    if (shouldApplyAttributes) {
      this._applyAttributes();
    }

    if (shouldRender) {
      this._render();
    }
  }

  private _createState(): FormattedInputEditorState {
    const context = this._pluginPipeline.execute(
      new FormattedInputPluginContext({
        phase: 'createState',
        rawValue: this._value,
        rawOffset: this._selection.focus.position.rawOffset,
        selection: this._selection,
      }),
    );
    const pluginState = context.getState();

    if (pluginState !== null) {
      return pluginState;
    }

    const state = createFormattedInputEditorState(this._value);
    const selection = this._selectionService.normalizeSelection(state, this._selection);

    return state.withSelection(selection);
  }

  private _createTransaction(command: TFormattedInputEditorCommand): IFormattedInputDispatchContext {
    const state = this._createState();
    const dispatchContext = this._pluginPipeline.execute(
      new FormattedInputPluginContext({
        phase: 'dispatchCommand',
        command,
        rawValue: this._value,
        rawOffset: state.selection.focus.position.rawOffset,
        state,
      }),
    );
    const transaction = dispatchContext.getTransaction() ?? this._transactionEngine.dispatch(state, command);
    const afterTransactionContext = new FormattedInputPluginContext({
      phase: 'afterTransaction',
      command,
      rawValue: transaction.after.getRawValue(),
      rawOffset: transaction.after.selection.focus.position.rawOffset,
      state: transaction.after,
      transaction,
    });
    const changeValue = dispatchContext.getChangeValue();

    if (changeValue !== null) {
      afterTransactionContext.setChangeValue(changeValue);
    }

    if (!dispatchContext.shouldNotifyChange()) {
      afterTransactionContext.suppressChange();
    }

    const resolvedContext = this._pluginPipeline.execute(afterTransactionContext);

    return {
      context: resolvedContext,
      transaction: resolvedContext.getTransaction() ?? transaction,
    };
  }

  private _buildProjection(state: FormattedInputEditorState): IFormattedInputWebRenderModel {
    const projectionContext = this._pluginPipeline.execute(
      new FormattedInputPluginContext({
        phase: 'buildProjection',
        rawValue: state.getRawValue(),
        rawOffset: state.selection.focus.position.rawOffset,
        state,
      }),
    );
    const projection = projectionContext.getProjection() ?? this._projectionBuilder.build(state);
    const afterProjectionContext = this._pluginPipeline.execute(
      new FormattedInputPluginContext({
        phase: 'afterProjection',
        rawValue: state.getRawValue(),
        rawOffset: state.selection.focus.position.rawOffset,
        state,
        projection,
      }),
    );

    return afterProjectionContext.getProjection() ?? projection;
  }

  private _dispatch(command: TFormattedInputEditorCommand): IFormattedInputEditorTransactionResult {
    if (this._isReadOnlyInteraction() && isMutationCommand(command)) {
      return this._createNoopTransaction(command);
    }

    const dispatchContext = this._createTransaction(command);
    const transaction = dispatchContext.transaction;
    const projection = this._buildProjection(transaction.after);
    const changeValue = dispatchContext.context.getChangeValue() ?? transaction.after.getRawValue();

    this._value = changeValue;
    this._selection = transaction.after.selection;
    this._renderer.render(projection, this._placeholder);
    this._root.setAttribute('aria-valuetext', this._value);

    if (dispatchContext.context.shouldNotifyChange()) {
      this._onChange?.(changeValue, {
        transaction,
        projection,
      });
    }

    return transaction;
  }

  private _render(): void {
    const state = this._createState();
    const projection = this._buildProjection(state);

    this._renderer.render(projection, this._placeholder);
    this._root.setAttribute('aria-valuetext', this._value);
  }

  private _applyAttributes(): void {
    this._root.setAttribute('role', 'textbox');
    this._root.setAttribute('aria-multiline', 'false');
    this._root.setAttribute('aria-disabled', String(this._disabled));
    this._root.setAttribute('aria-readonly', String(this._readOnly));
    this._root.dataset.formattedInputDisabled = String(this._disabled);
    this._root.dataset.formattedInputReadOnly = String(this._readOnly);

    this._applyStringAttribute('autocapitalize', this._autoCapitalize);
    this._applyStringAttribute('autocorrect', this._autoCorrect);
    this._applyStringAttribute('enterkeyhint', this._enterKeyHint);
    this._applyStringAttribute('inputmode', this._inputMode);
    this._applyStringAttribute('spellcheck', this._spellCheck ?? false);

    if (this._disabled) {
      this._root.removeAttribute('contenteditable');
      this._root.removeAttribute('tabindex');
    } else {
      this._root.setAttribute('contenteditable', this._readOnly ? 'false' : 'true');
      this._root.tabIndex = 0;
    }
  }

  private _applyAutoFocus(): void {
    if (!this._autoFocus || this._disabled) {
      return;
    }

    this.focus();
  }

  private _applyStringAttribute(name: string, value: boolean | string | undefined): void {
    if (value === void 0) {
      this._root.removeAttribute(name);
      return;
    }

    this._root.setAttribute(name, String(value));
  }

  private _isReadOnlyInteraction(): boolean {
    return this._disabled || this._readOnly;
  }

  private _createNoopTransaction(command: TFormattedInputEditorCommand): IFormattedInputEditorTransactionResult {
    const state = this._createState();

    return {
      before: state,
      command,
      operations: [],
      after: state,
      clipboardText: null,
    };
  }

  private _setSelection(anchor: number, focus: number): IFormattedInputEditorTransactionResult {
    return this._dispatch({
      type: 'setSelection',
      selection: createSelection(anchor, focus),
    });
  }

  private _setPointerSelection(
    hit: IFormattedInputPointerHit,
    hadFocus: boolean,
  ): IFormattedInputEditorTransactionResult {
    return this._dispatch({
      type: 'setSelection',
      hadFocus,
      selection: createCollapsedPointerSelection(hit),
      source: 'pointer',
    });
  }

  private _resetSelectionOnBlur(): void {
    const endRawOffset = this._value.length;

    if (this._selection.isCollapsed() && this._selection.focus.position.rawOffset === endRawOffset) {
      return;
    }

    this._selection = FormattedInputSelection.collapsed(endRawOffset);
    this._render();
  }

  private _getPointerHit(event: Pick<MouseEvent, 'clientX'>): IFormattedInputPointerHit {
    return this._pointerController.getPointerHit(this._renderer.getLineViews(), event.clientX, this._value.length);
  }

  private _getDoubleClickRange(rawOffset: number): { end: number; start: number } {
    return this._selectionBoundaryResolver.resolveDoubleClickRange({
      rawOffset,
      rawValue: this._value,
    });
  }

  private _getRangeFocusForAnchor(anchor: number, range: { end: number; start: number }): number {
    if (anchor <= range.start) {
      return range.end;
    }

    if (anchor >= range.end) {
      return range.start;
    }

    return range.end;
  }

  private _getSelectedDisplayText(): string {
    const selection = window.getSelection();

    if (selection === null || selection.rangeCount === 0) {
      return '';
    }

    if (selection.anchorNode === null || selection.focusNode === null) {
      return '';
    }

    if (!this._root.contains(selection.anchorNode) || !this._root.contains(selection.focusNode)) {
      return '';
    }

    return selection.toString();
  }

  private _isDoublePointerDown(event: PointerEvent, hit: IFormattedInputPointerHit): boolean {
    return (
      hit.symbolRawOffset !== null &&
      this._lastPointerDown !== null &&
      this._lastPointerDown.symbolRawOffset === hit.symbolRawOffset &&
      event.timeStamp - this._lastPointerDown.timeStamp <= DOUBLE_CLICK_INTERVAL_MS
    );
  }

  private _savePointerDown(event: PointerEvent, hit: IFormattedInputPointerHit): void {
    this._lastPointerDown = {
      symbolRawOffset: hit.symbolRawOffset,
      timeStamp: event.timeStamp,
    };
  }

  private readonly _handleKeyDown = (event: KeyboardEvent): void => {
    if (event.ctrlKey || event.metaKey) {
      if (event.key.toLowerCase() === 'a') {
        event.preventDefault();
        this._dispatch({
          type: 'setSelection',
          selection: createSelection(0, this._value.length),
          source: 'keyboard',
        });
      }

      return;
    }

    if (event.shiftKey && (event.key === 'ArrowLeft' || event.key === 'ArrowRight')) {
      const range = this._selection.getRawRange();
      const focus = this._selection.focus.position.rawOffset;
      const nextFocus = event.key === 'ArrowLeft' ? Math.max(0, focus - 1) : Math.min(this._value.length, focus + 1);

      event.preventDefault();
      this._setSelection(range.start === focus ? range.end : range.start, nextFocus);
      return;
    }

    if (event.shiftKey && (event.key === 'Home' || event.key === 'End')) {
      const anchor = this._selection.anchor.position.rawOffset;
      const focus = event.key === 'Home' ? 0 : this._value.length;

      event.preventDefault();
      this._setSelection(anchor, focus);
      return;
    }

    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault();
      this._render();
      return;
    }

    const command = this._keyboardController.createCommand(event);

    if (!command || this._isReadOnlyInteraction()) {
      return;
    }

    event.preventDefault();
    this._dispatch(command);
  };

  private readonly _handlePaste = (event: ClipboardEvent): void => {
    if (this._isReadOnlyInteraction()) {
      return;
    }

    event.preventDefault();
    this._dispatch({
      type: 'pasteText',
      text: event.clipboardData?.getData('text/plain') ?? '',
    });
  };

  private readonly _handleCopy = (event: ClipboardEvent): void => {
    const selectedText = this._getSelectedDisplayText();

    if (selectedText.length === 0) {
      return;
    }

    event.preventDefault();
    event.clipboardData?.setData('text/plain', selectedText);
  };

  private readonly _handleCut = (event: ClipboardEvent): void => {
    if (this._isReadOnlyInteraction()) {
      return;
    }

    const selectedText = this._getSelectedDisplayText();

    if (selectedText.length === 0) {
      return;
    }

    event.preventDefault();

    this._dispatch({
      type: 'cutSelection',
    });

    event.clipboardData?.setData('text/plain', selectedText);
  };

  private readonly _handleBeforeInput = (event: InputEvent): void => {
    event.preventDefault();
  };

  private readonly _handleInput = (): void => {
    this._render();
  };

  private readonly _handlePointerDown = (event: PointerEvent): void => {
    if (this._disabled) {
      return;
    }

    if (event.button !== 0) {
      if (!this._selection.isCollapsed()) {
        event.preventDefault();
        this._root.focus();
        this._render();
      }

      return;
    }

    const hadFocus = document.activeElement === this._root;
    const hit = this._getPointerHit(event);
    const isDoublePointerDown = this._isDoublePointerDown(event, hit);

    event.preventDefault();
    this._root.focus();
    this._root.setPointerCapture(event.pointerId);
    this._savePointerDown(event, hit);

    if (isDoublePointerDown && hit.symbolRawOffset !== null) {
      const range = this._getDoubleClickRange(hit.symbolRawOffset);

      if (event.shiftKey) {
        const anchor = this._selection.anchor.position.rawOffset;
        const focus = this._getRangeFocusForAnchor(anchor, range);

        this._dragAnchor = anchor;
        this._setSelection(anchor, focus);
        return;
      }

      this._dragAnchor = range.start;
      this._setSelection(range.start, range.end);
      return;
    }

    if (event.shiftKey) {
      const anchor = this._selection.anchor.position.rawOffset;

      this._dragAnchor = anchor;
      this._setSelection(anchor, hit.rawOffset);
      return;
    }

    this._dragAnchor = hit.rawOffset;
    this._setPointerSelection(hit, hadFocus);
  };

  private readonly _handleContextMenu = (): void => {
    if (this._disabled || this._selection.isCollapsed()) {
      return;
    }

    this._root.focus();
    this._render();
  };

  private readonly _handleDoubleClick = (event: MouseEvent): void => {
    if (this._disabled) {
      return;
    }

    const hit = this._getPointerHit(event);

    if (hit.symbolRawOffset === null) {
      return;
    }

    const range = this._getDoubleClickRange(hit.symbolRawOffset);

    event.preventDefault();
    this._root.focus();

    if (event.shiftKey) {
      const anchor = this._selection.anchor.position.rawOffset;
      const focus = this._getRangeFocusForAnchor(anchor, range);

      this._dragAnchor = anchor;
      this._setSelection(anchor, focus);
      return;
    }

    this._dragAnchor = range.start;
    this._setSelection(range.start, range.end);
  };

  private readonly _handlePointerMove = (event: PointerEvent): void => {
    if (this._dragAnchor === null || this._disabled) {
      return;
    }

    event.preventDefault();
    this._setSelection(this._dragAnchor, this._getPointerHit(event).rawOffset);
  };

  private readonly _handlePointerUp = (event: PointerEvent): void => {
    if (this._root.hasPointerCapture(event.pointerId)) {
      this._root.releasePointerCapture(event.pointerId);
    }

    this._dragAnchor = null;
  };

  private readonly _handleFocus = (): void => {
    this._root.dataset.formattedInputFocused = 'true';
    this._renderer.syncDomSelection(this._buildProjection(this._createState()));
  };

  private readonly _handleBlur = (): void => {
    this._root.dataset.formattedInputFocused = 'false';
    this._dragAnchor = null;
    this._lastPointerDown = null;
    this._resetSelectionOnBlur();
  };
}
