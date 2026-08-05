import React, { useEffect, useRef } from 'react';
import cn from 'classnames';

import s from './default.module.scss';

interface IProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  disabled?: boolean;
  autoFocus?: boolean;
  target?: 'destructive';
  name?: string;
}

const toArray = (code: string | null) => {
  return (code || '').split('').map((char) => (char === ' ' ? '' : char));
};

const toString = (code: string[] | null) => {
  return Array.from(code || [], (char) => (!char ? ' ' : char)).join('');
};

export const InputOtp: React.FC<IProps> = ({
  value,
  name,
  onChange,
  length = 6,
  disabled = false,
  target,
  autoFocus = false,
}) => {
  const inputRefs = useRef<HTMLInputElement[]>([]);
  const hiddenInputRef = useRef<HTMLInputElement>(null);

  const updateValue = (event: React.FormEvent<HTMLInputElement>) => {
    const chars = event.currentTarget.value.slice(0, length);
    onChange(chars);
    if (chars.length < length) {
      focusInput(chars.length);
    }
  };

  const focusInput = (index: number) => {
    if (inputRefs.current[index]) {
      inputRefs.current[index].focus();
    }
  };

  const handleSingleInput = (char: string, index: number) => {
    const newValue = toArray(value);
    newValue[index] = char;
    onChange(toString(newValue));

    if (char && index < length - 1) {
      focusInput(index + 1);
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !toArray(value)[index] && index > 0) {
      focusInput(index - 1);
    }
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.select();
  };

  useEffect(() => {
    const abortController = new AbortController();

    if ('OTPCredential' in window) {
      navigator.credentials
        .get({
          otp: { transport: ['sms'] },
          signal: abortController.signal,
        } as any)
        .then((otp: any) => {
          onChange(otp.code);
        })
        .catch((error) => console.log(error));
    }

    return () => {
      abortController.abort('unmount');
    };
  }, []);

  useEffect(() => {
    if (autoFocus) {
      setTimeout(() => {
        focusInput(0);
      }, 200);
    }
  }, [autoFocus]);

  return (
    <div className={s.container}>
      {Array.from({ length }).map((_, index) => (
        <div key={index} className={s.inputView}>
          <input
            ref={(ref) => {
              if (ref) inputRefs.current[index] = ref;
            }}
            disabled={disabled}
            className={cn(s.input, target === 'destructive' && s.error)}
            maxLength={1}
            inputMode="numeric"
            value={toArray(value)[index] || ''}
            onInput={(e: React.FormEvent<HTMLInputElement>) => handleSingleInput(e.currentTarget.value, index)}
            onKeyDown={(e) => handleKeyPress(e, index)}
            onFocus={handleFocus}
            autoFocus={index === 0}
            name={name ? `name.${index}` : undefined}
          />
        </div>
      ))}

      <input
        ref={hiddenInputRef}
        style={{ position: 'absolute', opacity: 0, width: 1, height: 1 }}
        value=""
        onInput={updateValue}
        type="tel"
        inputMode="numeric"
        pattern="[0-9]*"
        autoComplete="one-time-code"
        autoCapitalize="off"
        maxLength={length}
      />
    </div>
  );
};
