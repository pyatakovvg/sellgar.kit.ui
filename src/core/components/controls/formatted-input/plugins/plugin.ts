import type {
  FormattedInputEditorState,
  FormattedInputSelection,
  IFormattedInputEditorTransactionResult,
  IFormattedInputWebRenderModel,
  TFormattedInputEditorCommand,
} from '../core';

export type TFormattedInputPluginPhase =
  | 'afterProjection'
  | 'afterTransaction'
  | 'buildProjection'
  | 'createState'
  | 'dispatchCommand';

export interface IFormattedInputPluginContextOptions {
  command?: TFormattedInputEditorCommand | null;
  phase: TFormattedInputPluginPhase;
  projection?: IFormattedInputWebRenderModel | null;
  rawOffset: number;
  rawValue: string;
  selection?: FormattedInputSelection | null;
  state?: FormattedInputEditorState | null;
  transaction?: IFormattedInputEditorTransactionResult | null;
}

export interface IFormattedInputPlugin {
  readonly name: string;
  readonly priority?: number;

  execute(context: FormattedInputPluginContext): FormattedInputPluginContext;
}

export class FormattedInputPluginContext {
  readonly command: TFormattedInputEditorCommand | null;
  readonly phase: TFormattedInputPluginPhase;
  readonly rawOffset: number;
  readonly rawValue: string;
  readonly selection: FormattedInputSelection | null;
  private _isHandled = false;
  private _shouldNotifyChange = true;
  private _changeValue: string | null;
  private _projection: IFormattedInputWebRenderModel | null;
  private _state: FormattedInputEditorState | null;
  private _transaction: IFormattedInputEditorTransactionResult | null;

  constructor(options: IFormattedInputPluginContextOptions) {
    this.command = options.command ?? null;
    this.phase = options.phase;
    this.rawOffset = options.rawOffset;
    this.rawValue = options.rawValue;
    this.selection = options.selection ?? null;
    this._changeValue = null;
    this._state = options.state ?? null;
    this._transaction = options.transaction ?? null;
    this._projection = options.projection ?? null;
  }

  getChangeValue(): string | null {
    return this._changeValue;
  }

  setChangeValue(value: string): this {
    this._changeValue = value;

    return this;
  }

  suppressChange(): this {
    this._shouldNotifyChange = false;

    return this;
  }

  shouldNotifyChange(): boolean {
    return this._shouldNotifyChange;
  }

  getState(): FormattedInputEditorState | null {
    return this._state;
  }

  setState(state: FormattedInputEditorState): this {
    this._state = state;

    return this;
  }

  getTransaction(): IFormattedInputEditorTransactionResult | null {
    return this._transaction;
  }

  setTransaction(transaction: IFormattedInputEditorTransactionResult): this {
    this._transaction = transaction;

    return this;
  }

  getProjection(): IFormattedInputWebRenderModel | null {
    return this._projection;
  }

  setProjection(projection: IFormattedInputWebRenderModel): this {
    this._projection = projection;

    return this;
  }

  markHandled(): this {
    this._isHandled = true;

    return this;
  }

  isHandled(): boolean {
    return this._isHandled;
  }
}
