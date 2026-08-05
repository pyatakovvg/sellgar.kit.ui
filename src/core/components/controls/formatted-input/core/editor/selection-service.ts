import {
  FormattedInputCaret,
  FormattedInputPosition,
  FormattedInputSelection,
  clampFormattedInputOffset,
} from '../domain';

import type { FormattedInputEditorState } from '../domain';
import type { TFormattedInputMoveDirection } from './command';

export class FormattedInputSelectionService {
  collapseAtRawOffset(state: FormattedInputEditorState, rawOffset: number): FormattedInputSelection {
    const normalizedOffset = clampFormattedInputOffset(rawOffset, state.getRawValue());
    const position = new FormattedInputPosition({
      rawOffset: normalizedOffset,
    });
    const caret = new FormattedInputCaret({
      position,
    });

    return new FormattedInputSelection({
      anchor: caret,
      focus: caret,
      direction: 'none',
    });
  }

  moveCaret(state: FormattedInputEditorState, direction: TFormattedInputMoveDirection): FormattedInputSelection {
    const rawValue = state.getRawValue();
    const currentOffset = state.selection.focus.position.rawOffset;

    if (direction === 'start') {
      return this.collapseAtRawOffset(state, 0);
    }

    if (direction === 'end') {
      return this.collapseAtRawOffset(state, rawValue.length);
    }

    const nextOffset = direction === 'left' ? currentOffset - 1 : currentOffset + 1;

    return this.collapseAtRawOffset(state, clampFormattedInputOffset(nextOffset, rawValue));
  }

  normalizeSelection(state: FormattedInputEditorState, selection: FormattedInputSelection): FormattedInputSelection {
    const rawValue = state.getRawValue();
    const anchorOffset = clampFormattedInputOffset(selection.anchor.position.rawOffset, rawValue);
    const focusOffset = clampFormattedInputOffset(selection.focus.position.rawOffset, rawValue);
    const anchor = new FormattedInputCaret({
      position: new FormattedInputPosition({
        rawOffset: anchorOffset,
      }),
      style: selection.anchor.style,
    });
    const focus = new FormattedInputCaret({
      position: new FormattedInputPosition({
        rawOffset: focusOffset,
      }),
      style: selection.focus.style,
    });

    return new FormattedInputSelection({
      anchor,
      focus,
      direction: selection.direction,
    });
  }
}
