import { FormattedInputLineView } from './line-view';
import { FormattedInputSymbolView } from './symbol-view';

import type {
  IFormattedInputSymbolRenderBox,
  IFormattedInputWebRenderModel,
  TFormattedInputCaretAffinity,
} from '../core';
import type { IFormattedInputBrowserClassNames } from './class-names';

export class FormattedInputDomRenderer {
  private readonly _root: HTMLElement;
  private readonly _classNames: IFormattedInputBrowserClassNames;
  private readonly _display: HTMLSpanElement;
  private readonly _symbolLayer: HTMLSpanElement;
  private _lineViews: FormattedInputLineView[] = [];
  private _scrollLeft = 0;

  constructor(root: HTMLElement, classNames: IFormattedInputBrowserClassNames) {
    this._root = root;
    this._classNames = classNames;
    this._display = document.createElement('span');
    this._symbolLayer = document.createElement('span');

    this._display.className = classNames.display;
    this._symbolLayer.className = classNames.symbolLayer;
    this._display.appendChild(this._symbolLayer);
    this._root.appendChild(this._display);
  }

  destroy(): void {
    this._display.remove();
  }

  getLineViews(): readonly FormattedInputLineView[] {
    return this._lineViews;
  }

  syncDomSelection(model: IFormattedInputWebRenderModel): void {
    this._syncDomSelection(model);
  }

  render(model: IFormattedInputWebRenderModel, placeholder: string | undefined): void {
    this._lineViews = [];
    this._symbolLayer.textContent = '';
    this._applyHorizontalScroll();

    if (model.displayValue.length === 0) {
      this._scrollLeft = 0;
      this._applyHorizontalScroll();
      this._renderPlaceholder(placeholder);
      this._syncDomSelection(model);
      return;
    }

    for (const line of model.lines) {
      const lineView = new FormattedInputLineView(line.key, this._classNames);

      for (const symbol of line.symbols) {
        lineView.appendSymbol(this._createSymbolView(symbol));
      }

      this._lineViews.push(lineView);
      this._symbolLayer.appendChild(lineView.element);
    }

    this._syncDomSelection(model);
    this._syncHorizontalScroll();
  }

  private _createSymbolView(box: IFormattedInputSymbolRenderBox): FormattedInputSymbolView {
    return new FormattedInputSymbolView(box, this._classNames);
  }

  private _getDomPositionForRawOffset(rawOffset: number): { node: Node; offset: number } {
    const firstLineView = this._lineViews[0];

    if (firstLineView === void 0) {
      return {
        node: this._symbolLayer,
        offset: 0,
      };
    }

    return firstLineView.getDomPositionForRawOffset(rawOffset);
  }

  private _getDomPositionForVisualOffset(visualOffset: number): { node: Node; offset: number } {
    const firstLineView = this._lineViews[0];

    if (firstLineView === void 0) {
      return {
        node: this._symbolLayer,
        offset: 0,
      };
    }

    return firstLineView.getDomPositionForVisualOffset(visualOffset);
  }

  private _getDomPositionForCaret(visualOffset: number, affinity: TFormattedInputCaretAffinity): { node: Node; offset: number } {
    const firstLineView = this._lineViews[0];

    if (firstLineView === void 0) {
      return {
        node: this._symbolLayer,
        offset: 0,
      };
    }

    if (affinity === 'after') {
      return firstLineView.getDomPositionForVisualOffsetEnd(visualOffset);
    }

    return firstLineView.getDomPositionForVisualOffset(visualOffset);
  }

  private _applyHorizontalScroll(): void {
    this._symbolLayer.style.transform = this._scrollLeft === 0 ? '' : `translateX(${-this._scrollLeft}px)`;
  }

  private _syncHorizontalScroll(): void {
    const selection = window.getSelection();

    if (selection === null || selection.rangeCount === 0 || !this._root.contains(selection.anchorNode)) {
      this._scrollLeft = 0;
      this._applyHorizontalScroll();
      return;
    }

    const range = selection.getRangeAt(0);
    const rangeRect = range.getBoundingClientRect();
    const viewportWidth = this._display.clientWidth;

    if (viewportWidth <= 0) {
      return;
    }

    const displayRect = this._display.getBoundingClientRect();
    const maxScrollLeft = Math.max(0, this._symbolLayer.scrollWidth - viewportWidth);

    if (rangeRect.left < displayRect.left) {
      this._scrollLeft -= displayRect.left - rangeRect.left;
    } else if (rangeRect.right > displayRect.right) {
      this._scrollLeft += rangeRect.right - displayRect.right;
    }

    this._scrollLeft = Math.min(Math.max(this._scrollLeft, 0), maxScrollLeft);
    this._applyHorizontalScroll();
  }

  private _syncDomSelection(model: IFormattedInputWebRenderModel): void {
    if (document.activeElement !== this._root) {
      return;
    }

    const selection = window.getSelection();

    if (selection === null) {
      return;
    }

    const range = document.createRange();

    if (model.selection === null) {
      const position = this._getDomPositionForCaret(model.caret.visualOffset, model.caret.affinity);

      range.setStart(position.node, position.offset);
      range.collapse(true);
    } else {
      const start = this._getDomPositionForVisualOffset(model.selection.startVisualOffset);
      const end = this._getDomPositionForVisualOffset(model.selection.endVisualOffset);

      range.setStart(start.node, start.offset);
      range.setEnd(end.node, end.offset);
    }

    selection.removeAllRanges();
    selection.addRange(range);
  }

  private _renderPlaceholder(placeholder: string | undefined): void {
    if (!placeholder) {
      return;
    }

    const element = document.createElement('span');

    element.className = this._classNames.placeholder;
    element.textContent = placeholder;
    this._symbolLayer.appendChild(element);
  }
}
