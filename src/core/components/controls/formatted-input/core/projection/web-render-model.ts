import type {
  IFormattedInputStyleConfig,
  TFormattedInputCaretAffinity,
  TFormattedInputSymbolHitMode,
  TFormattedInputSymbolRole,
} from '../domain';

export interface IFormattedInputSymbolRenderBox {
  key: string;
  text: string;
  role: TFormattedInputSymbolRole;
  hitMode: TFormattedInputSymbolHitMode;
  rawOffset: number | null;
  visualOffset: number;
  active: boolean;
  editable: boolean;
  className?: string;
  style: IFormattedInputStyleConfig;
  dataAttrs: Record<string, string>;
}

export interface IFormattedInputLineRenderBox {
  key: string;
  symbols: readonly IFormattedInputSymbolRenderBox[];
}

export interface IFormattedInputCaretRenderBox {
  affinity: TFormattedInputCaretAffinity;
  rawOffset: number;
  visualOffset: number;
  className?: string;
  style: IFormattedInputStyleConfig;
  dataAttrs: Record<string, string>;
}

export interface IFormattedInputSelectionRenderBox {
  startRawOffset: number;
  endRawOffset: number;
  startVisualOffset: number;
  endVisualOffset: number;
  dataAttrs: Record<string, string>;
}

export interface IFormattedInputWebRenderModel {
  rawValue: string;
  displayValue: string;
  lines: readonly IFormattedInputLineRenderBox[];
  caret: IFormattedInputCaretRenderBox;
  selection: IFormattedInputSelectionRenderBox | null;
}
