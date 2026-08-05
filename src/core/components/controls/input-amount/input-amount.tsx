import React from 'react';
import { useNumberFormat, NumberFormatOptions, format, unformat } from '@react-input/number-format';

import { Input } from '../input';
import type { IInputProps } from '../input';

const defaultLocale = 'ru-RU';

const defaultFormatOptions: NumberFormatOptions = {
  format: 'decimal',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
};

export interface IProps extends Omit<IInputProps, 'onChange' | 'value' | 'defaultValue'> {
  value?: string | number;
  defaultValue?: string;
  onChange: (value: string | undefined) => void;
}

const formatValue = (value?: string | number) => {
  return value ? format(value, { ...defaultFormatOptions, locales: defaultLocale }) : undefined;
};

export const InputAmountComponent: React.FC<IProps> = ({ ref, ...props }) => {
  const inputRef = useNumberFormat({ ...defaultFormatOptions, locales: defaultLocale });

  const [init, setInit] = React.useState(() => false);
  const startValue = React.useMemo<string | number | undefined>(() => props.value || props.defaultValue, []);
  const [value, setValue] = React.useState(() => formatValue(startValue));

  React.useImperativeHandle(ref, () => inputRef.current);

  React.useEffect(() => {
    if (init) {
      props.onChange(value ? unformat(value, defaultLocale) : undefined);
    } else {
      setInit(true);
    }
  }, [value]);

  React.useEffect(() => {
    if (init) {
      setValue(formatValue(props.value));
    }
  }, [props.value]);

  return (
    <Input
      ref={inputRef}
      {...props}
      value={value}
      onChange={(event) => {
        setValue(event.target.value);
      }}
    />
  );
};

type TInputAmount = typeof InputAmountComponent & {
  format: typeof format;
  unFormat: typeof unformat;
};

export const InputAmount: TInputAmount = Object.assign(InputAmountComponent, {
  format: format,
  unFormat: unformat,
});
