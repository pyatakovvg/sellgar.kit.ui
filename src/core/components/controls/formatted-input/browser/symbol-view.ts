import { applyFormattedInputDomStyle } from './dom-style';

import type { IFormattedInputSymbolRenderBox } from '../core';
import type { IFormattedInputBrowserClassNames } from './class-names';
import type { TFormattedInputDomStyle } from './dom-style';

export interface IFormattedInputPointerHit {
  rawOffset: number;
  symbolRawOffset: number | null;
  visualOffset: number;
}

export interface IFormattedInputDomPosition {
  node: Node;
  offset: number;
}

const getSymbolStyle = (box: IFormattedInputSymbolRenderBox): TFormattedInputDomStyle => ({
  ...box.style.cssVars,
  ...box.style.inlineStyle,
});

export class FormattedInputSymbolView {
  readonly element: HTMLSpanElement;
  private readonly _box: IFormattedInputSymbolRenderBox;

  constructor(box: IFormattedInputSymbolRenderBox, classNames: IFormattedInputBrowserClassNames) {
    const element = document.createElement('span');
    const elementClassNames = [classNames.token];

    if (box.className) {
      elementClassNames.push(box.className);
    }

    element.className = elementClassNames.join(' ');
    element.textContent = box.text;
    element.dataset.formattedInputSymbolRole = box.role;
    element.dataset.formattedInputVisualOffset = String(box.visualOffset);
    element.dataset.formattedInputEditable = String(box.editable);
    element.dataset.formattedInputActive = String(box.active);

    if (box.rawOffset !== null) {
      element.dataset.formattedInputRawOffset = String(box.rawOffset);
    }

    this._applyDataAttrs(element, box.dataAttrs);
    applyFormattedInputDomStyle(element, getSymbolStyle(box));

    this._box = box;
    this.element = element;
  }

  get rawOffset(): number | null {
    return this._box.rawOffset;
  }

  get visualOffset(): number {
    return this._box.visualOffset;
  }

  getEndDomPosition(): IFormattedInputDomPosition {
    const node = this._getTextNode();

    return {
      node,
      offset: node.textContent?.length ?? 0,
    };
  }

  getStartDomPosition(): IFormattedInputDomPosition {
    return {
      node: this._getTextNode(),
      offset: 0,
    };
  }

  getPointerHit(clientX: number): IFormattedInputPointerHit | null {
    if (this._box.rawOffset === null) {
      return null;
    }

    const rect = this.element.getBoundingClientRect();
    const midpoint = rect.left + rect.width / 2;

    if (clientX >= rect.left && clientX <= rect.right) {
      if (this._box.hitMode === 'cell') {
        return {
          rawOffset: this._box.rawOffset,
          symbolRawOffset: this._box.rawOffset,
          visualOffset: this._box.visualOffset,
        };
      }

      if (this._box.role === 'placeholder') {
        return {
          rawOffset: this._box.rawOffset,
          symbolRawOffset: this._box.rawOffset,
          visualOffset: this._box.visualOffset,
        };
      }

      const isBeforeMidpoint = clientX < midpoint;

      return {
        rawOffset: isBeforeMidpoint ? this._box.rawOffset : this._box.rawOffset + 1,
        symbolRawOffset: this._box.rawOffset,
        visualOffset: isBeforeMidpoint ? this._box.visualOffset : this._box.visualOffset + 1,
      };
    }

    if (clientX < midpoint) {
      return {
        rawOffset: this._box.rawOffset,
        symbolRawOffset: null,
        visualOffset: this._box.visualOffset,
      };
    }

    return null;
  }

  private _getTextNode(): Node {
    return this.element.firstChild ?? this.element;
  }

  private _applyDataAttrs(element: HTMLElement, dataAttrs: Record<string, string>): void {
    for (const [name, value] of Object.entries(dataAttrs)) {
      if (!name.startsWith('data-')) {
        continue;
      }

      element.setAttribute(name, value);
    }
  }
}
