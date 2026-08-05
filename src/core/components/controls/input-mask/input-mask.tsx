import React from 'react';
import { useMask, format, unformat, Replacement } from '@react-input/mask';

import { IInputProps, Input } from '../input';

export interface IProps extends Omit<IInputProps, 'onChange'> {
  mask: string;
  replacement?: string | Replacement;
  showMask?: boolean;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>, unformattedValue: string) => void;
}

const InputMaskComponent: React.FC<IProps> = ({
  ref,
  mask,
  replacement,
  showMask,
  value: _value,
  onChange,
  ...props
}) => {
  const inputRef = useMask({
    mask,
    replacement,
    showMask,
  });

  React.useImperativeHandle(ref, () => inputRef.current);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (onChange) {
      const formattedValue = event.target.value;
      const unformattedValue = unformat(formattedValue, { mask, replacement: replacement ?? '' });

      onChange(event, unformattedValue);
    }
  };

  return <Input ref={inputRef} {...props} onChange={handleChange} />;
};

type TInputMask = typeof InputMaskComponent & {
  format: (value: string, options: { mask: string; replacement: string | Replacement }) => string;
  unformat: (value: string, options: { mask: string; replacement: string | Replacement }) => string;
};

export const InputMask: TInputMask = Object.assign(InputMaskComponent, {
  format,
  unformat,
});
