import React from 'react';
import { useNumberFormat, NumberFormatOptions, format, unformat } from '@react-input/number-format';

import { Input } from '../input';
import type { IInputProps } from '../input';

const defaultLocale = 'ru-RU';
const defaultMaxValue = 99999999999;
type TFormatOptions = NumberFormatOptions & { locales?: string };

const getFormatOptions = (allowDecimal: boolean, allowNegative: boolean): TFormatOptions => {
  return {
    locales: defaultLocale,
    maximumFractionDigits: allowDecimal ? 2 : 0,
    signDisplay: allowNegative ? 'auto' : 'never',
  };
};

const formatValue = (value: number | undefined, allowDecimal: boolean, allowNegative: boolean) => {
  if (value === undefined) {
    return '';
  }

  return format(value, getFormatOptions(allowDecimal, allowNegative));
};

const normalizeValue = (value: number, allowDecimal: boolean, allowNegative: boolean) => {
  const decimalNormalizedValue = allowDecimal ? value : Math.trunc(value);
  return allowNegative ? decimalNormalizedValue : Math.abs(decimalNormalizedValue);
};

export interface IProps extends Omit<IInputProps, 'onChange' | 'value' | 'defaultValue'> {
  value?: number;
  defaultValue?: number;
  maxValue?: number;
  allowDecimal?: boolean;
  allowNegative?: boolean;
  onChange?: (value: string, unformatValue: number | undefined) => void;
}

export const InputNumeralComponent: React.FC<IProps> = ({
  ref,
  value,
  defaultValue,
  maxValue = defaultMaxValue,
  allowDecimal = true,
  allowNegative = true,
  onChange,
  ...props
}) => {
  const formatOptions = React.useMemo(
    () => getFormatOptions(allowDecimal, allowNegative),
    [allowDecimal, allowNegative],
  );
  const inputRef = useNumberFormat(formatOptions);
  const [formattedValue, setFormattedValue] = React.useState<string>(() =>
    formatValue(
      value !== undefined
        ? normalizeValue(value, allowDecimal, allowNegative)
        : defaultValue !== undefined
          ? normalizeValue(defaultValue, allowDecimal, allowNegative)
          : undefined,
      allowDecimal,
      allowNegative,
    ),
  );

  React.useImperativeHandle(ref, () => inputRef.current);

  React.useEffect(() => {
    const nextFormattedValue = formatValue(
      value !== undefined ? normalizeValue(value, allowDecimal, allowNegative) : undefined,
      allowDecimal,
      allowNegative,
    );

    setFormattedValue((previousFormattedValue) => {
      if (allowDecimal && value !== undefined && previousFormattedValue.endsWith(',')) {
        const currentRawValue = unformat(previousFormattedValue, defaultLocale);
        const currentParsedValue = currentRawValue === '' ? undefined : Number(currentRawValue);

        if (currentParsedValue === value) {
          return previousFormattedValue;
        }
      }

      return nextFormattedValue;
    });
  }, [value, allowDecimal, allowNegative]);

  return (
    <Input
      ref={inputRef}
      {...props}
      value={formattedValue}
      onChange={(event) => {
        let nextFormattedValue = event.target.value;
        const previousFormattedValue = formattedValue ?? '';
        const nativeEvent = event.nativeEvent as InputEvent;
        const insertedValue = nativeEvent?.data;

        if (allowNegative && insertedValue === '-') {
          if (previousFormattedValue === '' || previousFormattedValue === '0') {
            setFormattedValue('-');
            onChange?.('-', undefined);
            return;
          }

          if (allowDecimal && previousFormattedValue === '0,') {
            setFormattedValue('-0,');
            onChange?.('-0,', undefined);
            return;
          }
        }

        if (allowDecimal) {
          nextFormattedValue = nextFormattedValue.replace(/[.]/g, ',');
          nextFormattedValue = nextFormattedValue.replace(/^,/, '0,').replace(/^-\,/, '-0,');

          const isDecimalSeparatorInput = insertedValue === ',' || insertedValue === '.';
          if (isDecimalSeparatorInput) {
            if (previousFormattedValue === '' || previousFormattedValue === '0') {
              nextFormattedValue = '0,';
            } else if (previousFormattedValue === '-' || previousFormattedValue === '-0') {
              nextFormattedValue = '-0,';
            } else if (!previousFormattedValue.includes(',')) {
              nextFormattedValue = `${previousFormattedValue},`;
            }
          }
        } else {
          nextFormattedValue = nextFormattedValue.replace(/[.,]/g, '');
        }

        const rawValue = unformat(nextFormattedValue, defaultLocale);
        const parsedValue = rawValue === '' ? undefined : Number(rawValue);

        if (parsedValue === undefined || Number.isNaN(parsedValue)) {
          setFormattedValue(nextFormattedValue);
          onChange?.(nextFormattedValue, undefined);
          return;
        }

        const normalizedValue = normalizeValue(parsedValue, allowDecimal, allowNegative);
        const integerPart = Math.trunc(Math.abs(normalizedValue));
        if (integerPart > maxValue) {
          return;
        }

        const normalizedFormattedValue = formatValue(normalizedValue, allowDecimal, allowNegative) ?? '';
        const shouldKeepIntermediateFormatted = normalizedValue === parsedValue;

        setFormattedValue(shouldKeepIntermediateFormatted ? nextFormattedValue : normalizedFormattedValue);
        onChange?.(shouldKeepIntermediateFormatted ? nextFormattedValue : normalizedFormattedValue, normalizedValue);
      }}
    />
  );
};

type TInputNumeral = typeof InputNumeralComponent & {
  format: typeof format;
  unFormat: typeof unformat;
};

export const InputNumeral: TInputNumeral = Object.assign(InputNumeralComponent, {
  format: format,
  unFormat: unformat,
});
