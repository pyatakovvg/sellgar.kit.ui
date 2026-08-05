import React from 'react';

import { Badge } from '../../status/badge';
import { Button } from './button';

import cn from 'classnames';
import s from './default.module.scss';

export interface IProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'className'> {
  ref?: React.Ref<HTMLInputElement>;
  inputType?: 'default' | 'borderless';
  leadIcon?: React.ReactNode;
  tailIcon?: React.ReactNode;
  badge?: React.ReactNode;
  size?: 'xs' | 'md';
  target?: 'destructive';
  button?: React.ReactElement<React.ComponentProps<typeof Button>>;
}

const InputComponent: React.FC<IProps> = ({
  ref,
  inputType = 'default',
  size = 'md',
  target,
  leadIcon,
  tailIcon,
  badge,
  button,
  ...props
}) => {
  const [isFocused, setFocused] = React.useState(false);
  const [isKeyboardFocused, setKeyboardFocused] = React.useState(false);
  const isPointerFocusRef = React.useRef(false);

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

  React.useEffect(() => {
    if (isFocused && props.disabled) {
      setFocused(false);
      setKeyboardFocused(false);
    }
  }, [props.disabled]);

  const handleFocus = (event: React.FocusEvent<HTMLInputElement>) => {
    setFocused(true);
    setKeyboardFocused(event.currentTarget.matches(':focus-visible') && !isPointerFocusRef.current);
    isPointerFocusRef.current = false;
    props.onFocus && props.onFocus(event);
  };

  const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    setFocused(false);
    setKeyboardFocused(false);
    props.onBlur && props.onBlur(event);
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLInputElement>) => {
    isPointerFocusRef.current = true;
    props.onPointerDown && props.onPointerDown(event);
  };

  const inputNode = (
    <div className={classNameInput}>
      {leadIcon && <div className={s['lead-icon']}>{leadIcon}</div>}
      <div className={s.content}>
        <input
          ref={ref}
          {...props}
          className={s.input}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onPointerDown={handlePointerDown}
        />
      </div>
      {badge && (
        <div className={s.badge}>
          {React.Children.map(badge, (child) => {
            if (React.isValidElement(child)) {
              const badge = child as React.ReactElement<React.ComponentProps<typeof Badge>>;

              return React.cloneElement(badge, { size: 'sm', disabled: props.disabled });
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

type TInput = typeof InputComponent & {
  Button: typeof Button;
};

export const Input: TInput = Object.assign(InputComponent, {
  Button,
});
