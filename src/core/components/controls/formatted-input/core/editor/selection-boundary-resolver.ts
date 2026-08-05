import { clampFormattedInputOffset } from '../domain';

import type { IFormattedInputRawRange } from '../domain';

export interface IFormattedInputSelectionBoundaryContext {
  rawOffset: number;
  rawValue: string;
}

export interface IFormattedInputSelectionBoundaryResolver {
  resolveDoubleClickRange(context: IFormattedInputSelectionBoundaryContext): IFormattedInputRawRange;
}

const WORD_BOUNDARY_REGEXP = /[\p{L}\p{N}_]/u;

const isWordCharacter = (character: string): boolean => WORD_BOUNDARY_REGEXP.test(character);

export class FormattedInputSelectionBoundaryResolver implements IFormattedInputSelectionBoundaryResolver {
  resolveDoubleClickRange(context: IFormattedInputSelectionBoundaryContext): IFormattedInputRawRange {
    const rawValue = context.rawValue;

    if (rawValue.length === 0) {
      return {
        start: 0,
        end: 0,
      };
    }

    const offset = clampFormattedInputOffset(context.rawOffset, rawValue);
    const characterOffset = Math.min(offset, rawValue.length - 1);
    const character = rawValue[characterOffset] ?? '';

    if (!isWordCharacter(character)) {
      return {
        start: characterOffset,
        end: characterOffset + 1,
      };
    }

    let start = characterOffset;
    let end = characterOffset + 1;

    while (start > 0 && isWordCharacter(rawValue[start - 1] ?? '')) {
      start -= 1;
    }

    while (end < rawValue.length && isWordCharacter(rawValue[end] ?? '')) {
      end += 1;
    }

    return {
      start,
      end,
    };
  }
}
