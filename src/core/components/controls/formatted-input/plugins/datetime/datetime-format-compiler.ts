export type TFormattedInputDateTimeSegment =
  | 'day'
  | 'fraction'
  | 'hour'
  | 'minute'
  | 'month'
  | 'offset'
  | 'second'
  | 'year';

export type TFormattedInputDateDisplaySlotPattern =
  | 'DD'
  | 'HH'
  | 'MM'
  | 'S'
  | 'SSS'
  | 'SSSSSS'
  | 'XXX'
  | 'YY'
  | 'YYYY'
  | 'mm'
  | 'ss';

export interface IFormattedInputDateDisplaySeparatorTokenOptions {
  readonly type: 'separator';
  readonly char: string;
  readonly className?: string;
}

export interface IFormattedInputDateDisplaySlotTokenOptions {
  readonly type: 'slot';
  readonly pattern: TFormattedInputDateDisplaySlotPattern;
  readonly className?: string;
  readonly placeholderClassName?: string;
  readonly valueClassName?: string;
}

export type TFormattedInputDateDisplayTokenOptions =
  | IFormattedInputDateDisplaySeparatorTokenOptions
  | IFormattedInputDateDisplaySlotTokenOptions;

export interface IFormattedInputDateTimeSlotToken {
  readonly type: 'slot';
  readonly className?: string;
  readonly pattern: string;
  readonly placeholderClassName?: string;
  readonly segment: TFormattedInputDateTimeSegment;
  readonly segmentOffset: number;
  readonly slotIndex: number;
  readonly valueClassName?: string;
}

export interface IFormattedInputDateTimeSeparatorToken {
  readonly type: 'separator';
  readonly char: string;
  readonly className?: string;
}

export type TFormattedInputDateTimeToken = IFormattedInputDateTimeSeparatorToken | IFormattedInputDateTimeSlotToken;

export interface IFormattedInputDateTimeTokenSpec {
  readonly pattern: TFormattedInputDateDisplaySlotPattern;
  readonly segment: TFormattedInputDateTimeSegment;
  readonly size: number;
}

export interface IFormattedInputDateTimePattern {
  readonly format: readonly TFormattedInputDateDisplayTokenOptions[];
  readonly slotCount: number;
  readonly tokens: readonly TFormattedInputDateTimeToken[];
}

const TOKEN_SPECS: readonly IFormattedInputDateTimeTokenSpec[] = [
  {
    pattern: 'YYYY',
    segment: 'year',
    size: 4,
  },
  {
    pattern: 'YY',
    segment: 'year',
    size: 2,
  },
  {
    pattern: 'DD',
    segment: 'day',
    size: 2,
  },
  {
    pattern: 'MM',
    segment: 'month',
    size: 2,
  },
  {
    pattern: 'HH',
    segment: 'hour',
    size: 2,
  },
  {
    pattern: 'mm',
    segment: 'minute',
    size: 2,
  },
  {
    pattern: 'ss',
    segment: 'second',
    size: 2,
  },
  {
    pattern: 'SSSSSS',
    segment: 'fraction',
    size: 6,
  },
  {
    pattern: 'SSS',
    segment: 'fraction',
    size: 3,
  },
  {
    pattern: 'S',
    segment: 'fraction',
    size: 1,
  },
  {
    pattern: 'XXX',
    segment: 'offset',
    size: 0,
  },
];

export class FormattedInputDateTimeFormatCompiler {
  compile(format: readonly TFormattedInputDateDisplayTokenOptions[]): IFormattedInputDateTimePattern {
    const tokens: TFormattedInputDateTimeToken[] = [];
    const segmentOffsets = this._createSegmentOffsets();
    let slotIndex = 0;

    for (const token of format) {
      if (token.type === 'separator') {
        for (const char of token.char) {
          tokens.push({
            type: 'separator',
            char,
            className: token.className,
          });
        }
        continue;
      }

      const spec = this._getTokenSpec(token.pattern);

      for (let offset = 0; offset < spec.size; offset++) {
        tokens.push({
          type: 'slot',
          className: token.className,
          pattern: spec.pattern,
          placeholderClassName: token.placeholderClassName,
          segment: spec.segment,
          segmentOffset: segmentOffsets[spec.segment],
          slotIndex,
          valueClassName: token.valueClassName,
        });
        segmentOffsets[spec.segment]++;
        slotIndex++;
      }
    }

    return {
      format,
      slotCount: slotIndex,
      tokens,
    };
  }

  private _createSegmentOffsets(): Record<TFormattedInputDateTimeSegment, number> {
    return {
      day: 0,
      fraction: 0,
      hour: 0,
      minute: 0,
      month: 0,
      offset: 0,
      second: 0,
      year: 0,
    };
  }

  private _getTokenSpec(pattern: TFormattedInputDateDisplaySlotPattern): IFormattedInputDateTimeTokenSpec {
    for (const spec of TOKEN_SPECS) {
      if (spec.pattern === pattern) {
        return spec;
      }
    }

    throw new TypeError(`Unknown date display token pattern: ${pattern}`);
  }
}
