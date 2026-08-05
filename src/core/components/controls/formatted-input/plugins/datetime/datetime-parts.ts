export interface IFormattedInputDateTimeParts {
  readonly day: string;
  readonly fraction: string;
  readonly hour: string;
  readonly minute: string;
  readonly month: string;
  readonly offset: string;
  readonly second: string;
  readonly year: string;
}

export interface IFormattedInputDateTimeDefaults {
  readonly fraction: string;
  readonly hour: string;
  readonly minute: string;
  readonly offset: string;
  readonly second: string;
}

const DEFAULT_ISO_TIME = '00';
const ISO_DATE_TIME_PATTERN =
  /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d+))?)?(Z|[+-]\d{2}:\d{2})?)?$/;

export const createFormattedInputDateTimeDefaults = (
  defaults?: Partial<IFormattedInputDateTimeDefaults>,
): IFormattedInputDateTimeDefaults => ({
  fraction: defaults?.fraction ?? '',
  hour: defaults?.hour ?? DEFAULT_ISO_TIME,
  minute: defaults?.minute ?? DEFAULT_ISO_TIME,
  offset: defaults?.offset ?? '+00:00',
  second: defaults?.second ?? DEFAULT_ISO_TIME,
});

export const createFormattedInputDateTimeParts = (
  options: Partial<IFormattedInputDateTimeParts>,
  defaults: IFormattedInputDateTimeDefaults,
): IFormattedInputDateTimeParts => ({
  day: options.day ?? '',
  fraction: options.fraction ?? defaults.fraction,
  hour: options.hour ?? defaults.hour,
  minute: options.minute ?? defaults.minute,
  month: options.month ?? '',
  offset: options.offset ?? defaults.offset,
  second: options.second ?? defaults.second,
  year: options.year ?? '',
});

export const parseFormattedInputIsoDateTime = (
  value: string,
  defaults: IFormattedInputDateTimeDefaults,
): IFormattedInputDateTimeParts | null => {
  const match = ISO_DATE_TIME_PATTERN.exec(value);

  if (match === null) {
    return null;
  }

  return createFormattedInputDateTimeParts(
    {
      day: match[3],
      fraction: match[7],
      hour: match[4],
      minute: match[5],
      month: match[2],
      offset: match[8] === 'Z' ? '+00:00' : match[8],
      second: match[6],
      year: match[1],
    },
    defaults,
  );
};

export const formatFormattedInputIsoDateTime = (parts: IFormattedInputDateTimeParts, outputFormat: string): string => {
  let result = '';
  let index = 0;
  let isLiteral = false;

  while (index < outputFormat.length) {
    const char = outputFormat[index];

    if (char === "'") {
      isLiteral = !isLiteral;
      index++;
      continue;
    }

    if (!isLiteral && outputFormat.startsWith('YYYY', index)) {
      result += parts.year;
      index += 4;
      continue;
    }

    if (!isLiteral && outputFormat.startsWith('YY', index)) {
      result += parts.year.slice(-2);
      index += 2;
      continue;
    }

    if (!isLiteral && outputFormat.startsWith('DD', index)) {
      result += parts.day;
      index += 2;
      continue;
    }

    if (!isLiteral && outputFormat.startsWith('MM', index)) {
      result += parts.month;
      index += 2;
      continue;
    }

    if (!isLiteral && outputFormat.startsWith('HH', index)) {
      result += parts.hour;
      index += 2;
      continue;
    }

    if (!isLiteral && outputFormat.startsWith('mm', index)) {
      result += parts.minute;
      index += 2;
      continue;
    }

    if (!isLiteral && outputFormat.startsWith('ss', index)) {
      result += parts.second;
      index += 2;
      continue;
    }

    if (!isLiteral && outputFormat.startsWith('XXX', index)) {
      result += parts.offset;
      index += 3;
      continue;
    }

    if (!isLiteral && char === 'S') {
      const start = index;

      while (outputFormat[index] === 'S') {
        index++;
      }

      result += parts.fraction.padEnd(index - start, '0').slice(0, index - start);
      continue;
    }

    result += char;
    index++;
  }

  return result;
};
