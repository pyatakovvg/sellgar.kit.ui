import type { FormattedInputLineView } from './line-view';
import type { IFormattedInputPointerHit } from './symbol-view';

export class FormattedInputPointerController {
  getPointerHit(
    lineViews: readonly FormattedInputLineView[],
    clientX: number,
    rawLength: number,
  ): IFormattedInputPointerHit {
    for (const lineView of lineViews) {
      const hit = lineView.getPointerHit(clientX);

      if (hit !== null) {
        return hit;
      }
    }

    const lastLineView = lineViews[lineViews.length - 1];

    return {
      rawOffset: rawLength,
      symbolRawOffset: rawLength === 0 ? null : rawLength - 1,
      visualOffset: lastLineView?.getEndVisualOffset() ?? rawLength,
    };
  }
}
