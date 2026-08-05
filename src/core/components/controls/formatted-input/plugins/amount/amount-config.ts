export type TFormattedInputAmountFractionDigits = 0 | 1 | 2;

export interface IFormattedInputAmountSymbolClassNames {
  decimalSeparator?: string;
  fraction?: string;
  groupSeparator?: string;
  integer?: string;
  negativeSign?: string;
  positiveSign?: string;
  sign?: string;
}

export interface IFormattedInputAmountConfigOptions {
  allowNegative?: boolean;
  allowPositiveSign?: boolean;
  fractionDigits?: TFormattedInputAmountFractionDigits;
  max?: number;
  maxIntegerDigits?: number;
  min?: number;
  name?: string;
  priority?: number;
  symbolClassNames?: IFormattedInputAmountSymbolClassNames;
}

interface IFormattedInputAmountParts {
  fraction: string;
  hasDecimal: boolean;
  integer: string;
  sign: string;
}

const DEFAULT_FRACTION_DIGITS = 2;
const INTEGER_GROUP_SIZE = 3;
const DECIMAL_SEPARATOR = '.';
const DECIMAL_SEPARATORS = '.,';
const GROUP_SEPARATORS = ' _\u00a0\u202f';
const NEGATIVE_SIGN = '-';
const POSITIVE_SIGN = '+';
const MAX_SAFE_AMOUNT_INTEGER = Number.MAX_SAFE_INTEGER;

const isDigit = (char: string): boolean => char >= '0' && char <= '9';

const isDecimalSeparator = (char: string): boolean => DECIMAL_SEPARATORS.includes(char);

const isGroupSeparator = (char: string): boolean => GROUP_SEPARATORS.includes(char);

const trimLeadingZeros = (value: string): string => {
  if (value.length <= 1) {
    return value;
  }

  const trimmed = value.replace(/^0+/, '');

  return trimmed.length === 0 ? '0' : trimmed;
};

const getSafeNumberScale = (fractionDigits: TFormattedInputAmountFractionDigits): number =>
  10 ** fractionDigits;

const getSafeAmountMax = (fractionDigits: TFormattedInputAmountFractionDigits): number => {
  const scale = getSafeNumberScale(fractionDigits);

  return MAX_SAFE_AMOUNT_INTEGER / scale;
};

export class FormattedInputAmountConfig {
  readonly allowNegative: boolean;
  readonly allowPositiveSign: boolean;
  readonly fractionDigits: TFormattedInputAmountFractionDigits;
  readonly max: number;
  readonly maxIntegerDigits: number;
  readonly maxSafeValue: number;
  readonly min: number | null;
  readonly name: string;
  readonly priority?: number;
  readonly symbolClassNames: IFormattedInputAmountSymbolClassNames;

  constructor(options: IFormattedInputAmountConfigOptions = {}) {
    this.allowNegative = options.allowNegative === true;
    this.allowPositiveSign = options.allowPositiveSign === true;
    this.fractionDigits = options.fractionDigits ?? DEFAULT_FRACTION_DIGITS;
    this.maxSafeValue = getSafeAmountMax(this.fractionDigits);
    this.max = typeof options.max === 'number' ? Math.min(options.max, this.maxSafeValue) : this.maxSafeValue;
    this.maxIntegerDigits =
      typeof options.maxIntegerDigits === 'number' && options.maxIntegerDigits > 0
        ? Math.min(Math.floor(options.maxIntegerDigits), this._getMaxSafeIntegerDigits())
        : this._getMaxSafeIntegerDigits();
    this.min = typeof options.min === 'number' ? options.min : null;
    this.name = options.name ?? 'amount';
    this.priority = options.priority;
    this.symbolClassNames = options.symbolClassNames ?? {};
  }

  formatNumber(value: number | undefined): string {
    if (value === void 0 || !Number.isFinite(value)) {
      return '';
    }

    const normalizedValue = this._normalizeNumberConstraint(value);

    if (normalizedValue === null) {
      return '';
    }

    const fixedValue = this._trimFractionZeros(normalizedValue.toFixed(this.fractionDigits));

    return this.normalizeRawValue(fixedValue);
  }

  normalizeEditValue(value: string): string {
    return this._normalizeText(value, false);
  }

  normalizePasteValue(value: string): string {
    return this._normalizeText(value, true);
  }

  normalizeRawValue(value: string): string {
    const rawValue = this._normalizeText(value, false);

    if (rawValue.length === 0 || this._isIncompleteRawValue(rawValue)) {
      return rawValue;
    }

    const parsedValue = this.parseRawValue(rawValue);

    if (parsedValue === void 0) {
      return '';
    }

    const normalizedValue = this._normalizeNumberConstraint(parsedValue);

    if (normalizedValue === null) {
      return '';
    }

    return this._normalizeText(this._trimFractionZeros(normalizedValue.toFixed(this.fractionDigits)), false);
  }

  parseRawValue(rawValue: string): number | undefined {
    if (rawValue.length === 0 || this._isSignOnlyRawValue(rawValue)) {
      return void 0;
    }

    const parseValue = rawValue.endsWith(DECIMAL_SEPARATOR) ? rawValue.slice(0, -1) : rawValue;
    const value = Number(parseValue);

    if (!Number.isFinite(value)) {
      return void 0;
    }

    return value;
  }

  isRawValueAllowed(rawValue: string): boolean {
    if (rawValue.length === 0 || this._isIncompleteRawValue(rawValue)) {
      return true;
    }

    return this._isValidRawValue(rawValue);
  }

  private _normalizeText(value: string, isPaste: boolean): string {
    const source = value.trim();

    if (source.length === 0) {
      return '';
    }

    const decimalIndex = isPaste ? this._findPasteDecimalIndex(source) : -1;
    const parts = this._createEmptyParts();

    for (let index = 0; index < source.length; index++) {
      const char = source[index];

      if (char === NEGATIVE_SIGN || char === POSITIVE_SIGN) {
        this._appendSign(parts, char);
        continue;
      }

      if (isDigit(char)) {
        this._appendDigit(parts, char);
        continue;
      }

      if (this.fractionDigits > 0 && isDecimalSeparator(char)) {
        if (!isPaste || index === decimalIndex) {
          this._appendDecimal(parts);
        }

        continue;
      }

      if (isGroupSeparator(char)) {
        continue;
      }
    }

    return this._composeRawValue(parts);
  }

  private _createEmptyParts(): IFormattedInputAmountParts {
    return {
      fraction: '',
      hasDecimal: false,
      integer: '',
      sign: '',
    };
  }

  private _appendSign(parts: IFormattedInputAmountParts, sign: string): void {
    if (parts.sign || parts.integer.length > 0 || parts.hasDecimal) {
      return;
    }

    if (sign === NEGATIVE_SIGN && this.allowNegative) {
      parts.sign = NEGATIVE_SIGN;
      return;
    }

    if (sign === POSITIVE_SIGN && this.allowPositiveSign) {
      parts.sign = POSITIVE_SIGN;
    }
  }

  private _appendDigit(parts: IFormattedInputAmountParts, digit: string): void {
    if (parts.hasDecimal) {
      if (parts.fraction.length < this.fractionDigits) {
        parts.fraction += digit;
      }

      return;
    }

    if (parts.integer === '0') {
      parts.integer = digit;
      return;
    }

    parts.integer += digit;
    parts.integer = trimLeadingZeros(parts.integer);
  }

  private _appendDecimal(parts: IFormattedInputAmountParts): void {
    if (parts.hasDecimal) {
      return;
    }

    parts.hasDecimal = true;

    if (parts.integer.length === 0) {
      parts.integer = '0';
    }
  }

  private _composeRawValue(parts: IFormattedInputAmountParts): string {
    if (parts.integer.length === 0 && !parts.hasDecimal) {
      return parts.sign;
    }

    const integer = parts.integer.length === 0 ? '0' : parts.integer;
    const decimal = parts.hasDecimal ? DECIMAL_SEPARATOR : '';

    return `${parts.sign}${integer}${decimal}${parts.fraction}`;
  }

  private _findPasteDecimalIndex(value: string): number {
    for (let index = value.length - 1; index >= 0; index--) {
      const char = value[index];

      if (!isDecimalSeparator(char)) {
        continue;
      }

      const digitsAfter = this._countDigits(value.slice(index + 1));

      if (digitsAfter > 0 && digitsAfter <= this.fractionDigits) {
        return index;
      }
    }

    return -1;
  }

  private _countDigits(value: string): number {
    let count = 0;

    for (const char of value) {
      if (isDigit(char)) {
        count++;
      }
    }

    return count;
  }

  private _isIncompleteRawValue(rawValue: string): boolean {
    return (
      this._isSignOnlyRawValue(rawValue) ||
      rawValue.endsWith(DECIMAL_SEPARATOR)
    );
  }

  private _isSignOnlyRawValue(rawValue: string): boolean {
    return rawValue === NEGATIVE_SIGN || rawValue === POSITIVE_SIGN;
  }

  private _isValidRawValue(rawValue: string): boolean {
    if (rawValue.length === 0 || this._isIncompleteRawValue(rawValue)) {
      return true;
    }

    if (!this._isIntegerDigitsAllowed(rawValue) || !this._isSafeRawValue(rawValue)) {
      return false;
    }

    const value = this.parseRawValue(rawValue);

    if (value === void 0) {
      return false;
    }

    if (this.min !== null && value < this.min) {
      return false;
    }

    if (value > this.max) {
      return false;
    }

    return true;
  }

  private _isIntegerDigitsAllowed(rawValue: string): boolean {
    const unsignedValue = rawValue[0] === NEGATIVE_SIGN || rawValue[0] === POSITIVE_SIGN ? rawValue.slice(1) : rawValue;
    const decimalIndex = unsignedValue.indexOf(DECIMAL_SEPARATOR);
    const integer = decimalIndex === -1 ? unsignedValue : unsignedValue.slice(0, decimalIndex);

    return integer.length <= this.maxIntegerDigits;
  }

  private _isSafeRawValue(rawValue: string): boolean {
    if (rawValue.length === 0 || this._isIncompleteRawValue(rawValue)) {
      return true;
    }

    const unsignedValue = rawValue[0] === NEGATIVE_SIGN || rawValue[0] === POSITIVE_SIGN ? rawValue.slice(1) : rawValue;
    const decimalIndex = unsignedValue.indexOf(DECIMAL_SEPARATOR);
    const integer = decimalIndex === -1 ? unsignedValue : unsignedValue.slice(0, decimalIndex);
    const fraction = decimalIndex === -1 ? '' : unsignedValue.slice(decimalIndex + 1);
    const paddedFraction = fraction.padEnd(this.fractionDigits, '0');
    const scaledDigits = `${integer}${paddedFraction}`.replace(/^0+/, '') || '0';

    return Number.isSafeInteger(Number(scaledDigits));
  }

  private _normalizeNumberConstraint(value: number): number | null {
    if (!Number.isFinite(value)) {
      return null;
    }

    let nextValue = value;

    if (this.min !== null && nextValue < this.min) {
      nextValue = this.min;
    }

    if (nextValue > this.max) {
      nextValue = this.max;
    }

    const scale = getSafeNumberScale(this.fractionDigits);
    nextValue = Math.round(nextValue * scale) / scale;

    if (!Number.isSafeInteger(Math.round(Math.abs(nextValue) * scale))) {
      return null;
    }

    return nextValue;
  }

  private _getMaxSafeIntegerDigits(): number {
    return Math.floor(this.maxSafeValue).toString().length;
  }

  private _trimFractionZeros(value: string): string {
    if (!value.includes(DECIMAL_SEPARATOR)) {
      return value;
    }

    return value.replace(/0+$/, '').replace(/\.$/, '');
  }
}
