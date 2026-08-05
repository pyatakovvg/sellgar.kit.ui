import type { FormattedInputEditorState } from '../domain';
import type {
  IFormattedInputCaretRenderBox,
  IFormattedInputLineRenderBox,
  IFormattedInputSelectionRenderBox,
  IFormattedInputSymbolRenderBox,
  IFormattedInputWebRenderModel,
} from './web-render-model';

export class FormattedInputWebProjectionBuilder {
  build(state: FormattedInputEditorState): IFormattedInputWebRenderModel {
    const activeVisualOffset = this._getActiveVisualOffset(state);
    const lines = state.document.lines.map<IFormattedInputLineRenderBox>((line) => ({
      key: line.id,
      symbols: line.getSymbols().map<IFormattedInputSymbolRenderBox>((node) => ({
        key: node.symbol.id,
        text: node.symbol.toDisplayText(),
        role: node.symbol.role,
        hitMode: node.symbol.hitMode,
        rawOffset: node.rawOffset,
        visualOffset: node.visualOffset,
        active: node.visualOffset === activeVisualOffset,
        editable: node.symbol.editable,
        className: node.symbol.style.className,
        style: node.symbol.style,
        dataAttrs: {
          'data-symbol-role': node.symbol.role,
          'data-raw-offset': node.rawOffset === null ? '' : String(node.rawOffset),
          'data-visual-offset': String(node.visualOffset),
        },
      })),
    }));

    return {
      rawValue: state.getRawValue(),
      displayValue: state.getDisplayValue(),
      lines,
      caret: this._createCaretBox(state),
      selection: this._createSelectionBox(state),
    };
  }

  private _getActiveVisualOffset(state: FormattedInputEditorState): number | null {
    if (!state.selection.isCollapsed()) {
      return null;
    }

    return state.selection.focus.position.visualOffset;
  }

  private _createCaretBox(state: FormattedInputEditorState): IFormattedInputCaretRenderBox {
    const caret = state.selection.focus;

    return {
      affinity: caret.position.affinity,
      rawOffset: caret.position.rawOffset,
      visualOffset: caret.position.visualOffset,
      className: caret.style.className,
      style: caret.style,
      dataAttrs: {
        'data-caret-raw-offset': String(caret.position.rawOffset),
        'data-caret-visual-offset': String(caret.position.visualOffset),
      },
    };
  }

  private _createSelectionBox(state: FormattedInputEditorState): IFormattedInputSelectionRenderBox | null {
    if (state.selection.isCollapsed()) {
      return null;
    }

    const range = state.selection.getRawRange();
    const visualRange = this._createSelectionVisualRange(state, range.start, range.end);

    return {
      startRawOffset: range.start,
      endRawOffset: range.end,
      startVisualOffset: visualRange.start,
      endVisualOffset: visualRange.end,
      dataAttrs: {
        'data-selection-start': String(range.start),
        'data-selection-end': String(range.end),
      },
    };
  }

  private _createSelectionVisualRange(
    state: FormattedInputEditorState,
    startRawOffset: number,
    endRawOffset: number,
  ): { end: number; start: number } {
    const symbols = state.document.getSymbols();

    if (symbols.length === 0) {
      return {
        start: 0,
        end: 0,
      };
    }

    if (startRawOffset === 0 && endRawOffset === state.getRawValue().length) {
      return {
        start: symbols[0].visualOffset,
        end: symbols[symbols.length - 1].visualOffset + 1,
      };
    }

    return {
      start: this._getVisualOffsetForRawOffset(symbols, startRawOffset),
      end: this._getVisualOffsetForRawOffset(symbols, endRawOffset),
    };
  }

  private _getVisualOffsetForRawOffset(
    symbols: ReturnType<FormattedInputEditorState['document']['getSymbols']>,
    rawOffset: number,
  ): number {
    for (const symbol of symbols) {
      if (symbol.rawOffset !== null && symbol.rawOffset >= rawOffset) {
        return symbol.visualOffset;
      }
    }

    return symbols[symbols.length - 1].visualOffset + 1;
  }
}
