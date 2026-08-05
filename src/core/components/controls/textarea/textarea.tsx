import React from 'react';

import cn from 'classnames';
import s from './default.module.scss';

export interface IProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'size' | 'className'> {
  ref?: React.RefCallback<HTMLTextAreaElement> | React.RefObject<HTMLTextAreaElement>;
  size?: 'xs' | 'md';
  target?: 'destructive';
}

const useAutosizeTextArea = (textAreaRef: React.RefObject<HTMLTextAreaElement | null>, value: any) => {
  React.useEffect(() => {
    if (textAreaRef?.current) {
      textAreaRef.current.style.height = 'auto';
      textAreaRef.current.style.height = `${textAreaRef.current.scrollHeight}px`;
    }
  }, [textAreaRef, value]);
};

export const Textarea: React.FC<IProps> = ({ ref, size = 'md', target, ...props }) => {
  const inputRef = React.useRef<HTMLTextAreaElement>(null);
  const [value, setValue] = React.useState(props.defaultValue || props.value);
  const [isFocused, setFocused] = React.useState(false);
  const [isKeyboardFocused, setKeyboardFocused] = React.useState(false);
  const isPointerFocusRef = React.useRef(false);
  const classNameButton = React.useMemo(
    () =>
      cn(
        s.wrapper,
        {
          [s['focused']]: isFocused,
          [s['keyboard-focused']]: isKeyboardFocused,
        },
        {
          [s['size--medium']]: size === 'md',
          [s['size--extra-small']]: size === 'xs',
        },
        {
          [s['disabled']]: props.disabled,
        },
        {
          [s['destructive']]: target === 'destructive',
        },
      ),
    [isFocused, isKeyboardFocused, size, target, props.disabled],
  );

  React.useImperativeHandle(ref, () => inputRef.current!, [inputRef]);

  React.useEffect(() => {
    if (isFocused && props.disabled) {
      setFocused(false);
      setKeyboardFocused(false);
    }
  }, [isFocused, props.disabled]);

  useAutosizeTextArea(inputRef, value);

  const handleFocus = (event: React.FocusEvent<HTMLTextAreaElement>) => {
    setFocused(true);
    setKeyboardFocused(event.currentTarget.matches(':focus-visible') && !isPointerFocusRef.current);
    isPointerFocusRef.current = false;
    props.onFocus && props.onFocus(event);
  };

  const handleBlur = (event: React.FocusEvent<HTMLTextAreaElement>) => {
    setFocused(false);
    setKeyboardFocused(false);
    props.onBlur && props.onBlur(event);
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLTextAreaElement>) => {
    isPointerFocusRef.current = true;
    props.onPointerDown && props.onPointerDown(event);
  };

  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(event.target.value);
    props.onChange && props.onChange(event);
  };

  return (
    <div className={classNameButton}>
      <div className={s.content}>
        <textarea
          ref={inputRef}
          {...props}
          className={s.input}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onPointerDown={handlePointerDown}
          onChange={handleChange}
        />
      </div>
    </div>
  );
};
