import React from 'react';

import {
  FormattedInput,
  FormattedInputOtpPlugin,
} from '../formatted-input';

import cn from 'classnames';
import s from './default.module.scss';

export interface IInputOtp2Props {
  autoFocus?: boolean;
  disabled?: boolean;
  length?: number;
  onBlur?: React.FocusEventHandler<HTMLSpanElement>;
  onChange: (value: string) => void;
  onFocus?: React.FocusEventHandler<HTMLSpanElement>;
  readOnly?: boolean;
  target?: 'destructive';
  value: string;
}

const DEFAULT_LENGTH = 6;

export const InputOtp2: React.FC<IInputOtp2Props> = ({
  autoFocus,
  disabled = false,
  length = DEFAULT_LENGTH,
  onBlur,
  onChange,
  onFocus,
  readOnly = false,
  target,
  value,
}) => {
  const plugins = React.useMemo(
    () => [
      new FormattedInputOtpPlugin({
        length,
        symbolClassNames: {
          active: s.active,
          cell: s.cell,
          empty: s.empty,
          filled: s.filled,
        },
      }),
    ],
    [length],
  );

  const className = React.useMemo(
    () =>
      cn(s.root, {
        [s.destructive]: target === 'destructive',
        [s.disabled]: disabled,
      }),
    [disabled, target],
  );

  return (
    <FormattedInput
      autoFocus={autoFocus}
      className={className}
      disabled={disabled}
      inputMode="numeric"
      plugins={plugins}
      readOnly={readOnly}
      spellCheck={false}
      value={value}
      onBlur={onBlur}
      onChange={onChange}
      onFocus={onFocus}
    />
  );
};
