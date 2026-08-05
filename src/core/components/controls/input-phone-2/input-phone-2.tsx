import React from 'react';

import {
  FORMATTED_INPUT_MASK_DIGIT_RULE,
  FormattedInput,
  FormattedInputMaskPlugin,
} from '../formatted-input';
import { Badge } from '../../status/badge';

import type { TFormattedInputMaskTokenOptions } from '../formatted-input';

import cn from 'classnames';
import s from './default.module.scss';

const PHONE_RAW_PREFIX = '7';
const PHONE_SLOT_PLACEHOLDER = '_';

const PHONE_MASK: readonly TFormattedInputMaskTokenOptions[] = [
  { type: 'separator', char: '+' },
  { type: 'literal', char: PHONE_RAW_PREFIX },
  { type: 'separator', char: ' ' },
  { type: 'separator', char: '(' },
  {
    type: 'slot',
    placeholder: PHONE_SLOT_PLACEHOLDER,
    rule: FORMATTED_INPUT_MASK_DIGIT_RULE,
    placeholderClassName: s.placeholder,
  },
  {
    type: 'slot',
    placeholder: PHONE_SLOT_PLACEHOLDER,
    rule: FORMATTED_INPUT_MASK_DIGIT_RULE,
    placeholderClassName: s.placeholder,
  },
  {
    type: 'slot',
    placeholder: PHONE_SLOT_PLACEHOLDER,
    rule: FORMATTED_INPUT_MASK_DIGIT_RULE,
    placeholderClassName: s.placeholder,
  },
  { type: 'separator', char: ')' },
  { type: 'separator', char: ' ' },
  {
    type: 'slot',
    placeholder: PHONE_SLOT_PLACEHOLDER,
    rule: FORMATTED_INPUT_MASK_DIGIT_RULE,
    placeholderClassName: s.placeholder,
  },
  {
    type: 'slot',
    placeholder: PHONE_SLOT_PLACEHOLDER,
    rule: FORMATTED_INPUT_MASK_DIGIT_RULE,
    placeholderClassName: s.placeholder,
  },
  {
    type: 'slot',
    placeholder: PHONE_SLOT_PLACEHOLDER,
    rule: FORMATTED_INPUT_MASK_DIGIT_RULE,
    placeholderClassName: s.placeholder,
  },
  { type: 'separator', char: ' ' },
  {
    type: 'slot',
    placeholder: PHONE_SLOT_PLACEHOLDER,
    rule: FORMATTED_INPUT_MASK_DIGIT_RULE,
    placeholderClassName: s.placeholder,
  },
  {
    type: 'slot',
    placeholder: PHONE_SLOT_PLACEHOLDER,
    rule: FORMATTED_INPUT_MASK_DIGIT_RULE,
    placeholderClassName: s.placeholder,
  },
  { type: 'separator', char: ' ' },
  {
    type: 'slot',
    placeholder: PHONE_SLOT_PLACEHOLDER,
    rule: FORMATTED_INPUT_MASK_DIGIT_RULE,
    placeholderClassName: s.placeholder,
  },
  {
    type: 'slot',
    placeholder: PHONE_SLOT_PLACEHOLDER,
    rule: FORMATTED_INPUT_MASK_DIGIT_RULE,
    placeholderClassName: s.placeholder,
  },
];

type TInputSize = 'md' | 'xs';
type TInputType = 'borderless' | 'default';
type TInputTarget = 'destructive';
type TInputButtonElement = React.ReactElement<{
  disabled?: boolean;
  size?: TInputSize;
}>;
type TInputSpellCheck = boolean | 'false' | 'true';

export interface IInputPhone2Props {
  autoFocus?: boolean;
  badge?: React.ReactNode;
  button?: TInputButtonElement;
  defaultValue?: string;
  disabled?: boolean;
  id?: string;
  inputType?: TInputType;
  leadIcon?: React.ReactNode;
  onBlur?: React.FocusEventHandler<HTMLSpanElement>;
  onChange?: (value: string) => void;
  onCopy?: React.ClipboardEventHandler<HTMLSpanElement>;
  onCut?: React.ClipboardEventHandler<HTMLSpanElement>;
  onFocus?: React.FocusEventHandler<HTMLSpanElement>;
  onKeyDown?: React.KeyboardEventHandler<HTMLSpanElement>;
  onMouseEnter?: React.MouseEventHandler<HTMLSpanElement>;
  onMouseLeave?: React.MouseEventHandler<HTMLSpanElement>;
  onPaste?: React.ClipboardEventHandler<HTMLSpanElement>;
  onPointerDown?: React.PointerEventHandler<HTMLSpanElement>;
  placeholder?: string;
  readOnly?: boolean;
  size?: TInputSize;
  spellCheck?: TInputSpellCheck;
  style?: React.CSSProperties;
  tabIndex?: number;
  tailIcon?: React.ReactNode;
  target?: TInputTarget;
  title?: string;
  value?: string;
}

export const InputPhone2: React.FC<IInputPhone2Props> = (componentProps) => {
  const isValueControlled = Object.prototype.hasOwnProperty.call(componentProps, 'value');
  const {
    badge,
    button,
    defaultValue,
    inputType = 'default',
    leadIcon,
    onChange,
    size = 'md',
    tailIcon,
    target,
    value,
    ...props
  } = componentProps;
  const [isFocused, setFocused] = React.useState(false);
  const [isKeyboardFocused, setKeyboardFocused] = React.useState(false);
  const isPointerFocusRef = React.useRef(false);
  const [rawValue, setRawValue] = React.useState(() => value ?? defaultValue ?? '');

  const classNameInput = React.useMemo(
    () =>
      cn(
        s.wrapper,
        {
          [s['focused']]: isFocused && inputType !== 'borderless',
          [s['keyboard-focused']]: isKeyboardFocused && inputType !== 'borderless',
        },
        {
          [s['type--default']]: inputType === 'default',
          [s['type--borderless']]: inputType === 'borderless',
        },
        {
          [s['size--medium']]: size === 'md',
          [s['size--extra-small']]: size === 'xs',
        },
        {
          [s['with-button']]: !!button,
        },
        {
          [s['disabled']]: props.disabled,
        },
        {
          [s['destructive']]: target === 'destructive',
        },
      ),
    [isFocused, isKeyboardFocused, size, target, button, props.disabled, inputType],
  );

  const plugins = React.useMemo(
    () => [
      new FormattedInputMaskPlugin({
        mask: PHONE_MASK,
      }),
    ],
    [],
  );

  React.useEffect(() => {
    if (isFocused && props.disabled) {
      setFocused(false);
      setKeyboardFocused(false);
    }
  }, [isFocused, props.disabled]);

  React.useEffect(() => {
    if (isValueControlled) {
      setRawValue(value ?? '');
    }
  }, [isValueControlled, value]);

  const handleFocus = (event: React.FocusEvent<HTMLSpanElement>) => {
    setFocused(true);
    setKeyboardFocused(event.currentTarget.matches(':focus-visible') && !isPointerFocusRef.current);
    isPointerFocusRef.current = false;
    props.onFocus?.(event);
  };

  const handleBlur = (event: React.FocusEvent<HTMLSpanElement>) => {
    setFocused(false);
    setKeyboardFocused(false);
    props.onBlur?.(event);
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLSpanElement>) => {
    isPointerFocusRef.current = true;
    props.onPointerDown?.(event);
  };

  const handleChange = React.useCallback(
    (nextRawValue: string) => {
      setRawValue(nextRawValue);
      onChange?.(nextRawValue);
    },
    [onChange],
  );

  const inputNode = (
    <div className={classNameInput}>
      {leadIcon && <div className={s['lead-icon']}>{leadIcon}</div>}
      <div className={s.content}>
        <FormattedInput
          {...props}
          className={s.input}
          inputMode="tel"
          plugins={plugins}
          value={rawValue}
          onBlur={handleBlur}
          onChange={handleChange}
          onFocus={handleFocus}
          onPointerDown={handlePointerDown}
        />
      </div>
      {badge && (
        <div className={s.badge}>
          {React.Children.map(badge, (child) => {
            if (React.isValidElement(child)) {
              const badgeNode = child as React.ReactElement<React.ComponentProps<typeof Badge>>;

              return React.cloneElement(badgeNode, { size: 'sm', disabled: props.disabled });
            }

            return child;
          })}
        </div>
      )}
      {tailIcon && <div className={s['tail-icon']}>{tailIcon}</div>}
    </div>
  );

  if (button) {
    return (
      <div className={s.container}>
        {inputNode}
        {React.cloneElement(button, {
          size,
          disabled: props.disabled,
        })}
      </div>
    );
  }

  return inputNode;
};
