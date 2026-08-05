import { FormattedInputSymbolView } from './symbol-view';

import type { IFormattedInputBrowserClassNames } from './class-names';
import type { IFormattedInputDomPosition, IFormattedInputPointerHit } from './symbol-view';

export class FormattedInputLineView {
  readonly element: HTMLSpanElement;
  private readonly _symbolViews: FormattedInputSymbolView[] = [];

  constructor(key: string, classNames: IFormattedInputBrowserClassNames) {
    this.element = document.createElement('span');
    this.element.className = classNames.line;
    this.element.dataset.formattedInputLineKey = key;
  }

  appendSymbol(symbolView: FormattedInputSymbolView): void {
    this._symbolViews.push(symbolView);
    this.element.appendChild(symbolView.element);
  }

  getPointerHit(clientX: number): IFormattedInputPointerHit | null {
    for (const symbolView of this._symbolViews) {
      const hit = symbolView.getPointerHit(clientX);

      if (hit !== null) {
        return hit;
      }
    }

    return null;
  }

  getEndDomPosition(): IFormattedInputDomPosition {
    const lastSymbolView = this._symbolViews[this._symbolViews.length - 1];

    if (lastSymbolView === void 0) {
      return {
        node: this.element,
        offset: 0,
      };
    }

    return lastSymbolView.getEndDomPosition();
  }

  getEndVisualOffset(): number {
    const lastSymbolView = this._symbolViews[this._symbolViews.length - 1];

    if (lastSymbolView === void 0) {
      return 0;
    }

    return lastSymbolView.visualOffset + 1;
  }

  getDomPositionForRawOffset(rawOffset: number): IFormattedInputDomPosition {
    for (const symbolView of this._symbolViews) {
      if (symbolView.rawOffset !== null && symbolView.rawOffset >= rawOffset) {
        return symbolView.getStartDomPosition();
      }
    }

    return this.getEndDomPosition();
  }

  getDomPositionForVisualOffset(visualOffset: number): IFormattedInputDomPosition {
    for (const symbolView of this._symbolViews) {
      if (symbolView.visualOffset >= visualOffset) {
        return symbolView.getStartDomPosition();
      }
    }

    return this.getEndDomPosition();
  }

  getDomPositionForVisualOffsetEnd(visualOffset: number): IFormattedInputDomPosition {
    for (const symbolView of this._symbolViews) {
      if (symbolView.visualOffset === visualOffset) {
        return symbolView.getEndDomPosition();
      }

      if (symbolView.visualOffset > visualOffset) {
        return symbolView.getStartDomPosition();
      }
    }

    return this.getEndDomPosition();
  }
}
