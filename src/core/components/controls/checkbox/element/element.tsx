import React from 'react';

import { CheckFillIcon, SubtractFillIcon } from '../../../../../icons';

import cn from 'classnames';
import s from './default.module.scss';

export interface IProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  size?: 'sm' | 'md';
  isIndeterminate?: boolean;
}

export const Element: React.FC<IProps> = ({ size = 'md', isIndeterminate, ...props }) => {
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (inputRef.current) {
      inputRef.current.indeterminate = Boolean(isIndeterminate);
    }
  }, [isIndeterminate]);

  const ariaChecked = isIndeterminate ? 'mixed' : props['aria-checked'];

  const classNameInput = React.useMemo(
    () =>
      cn(
        s.wrapper,
        {
          [s['size--medium']]: size === 'md',
          [s['size--small']]: size === 'sm',
        },
        {
          [s.indeterminate]: isIndeterminate,
          [s.disabled]: props.disabled,
        },
      ),
    [size, props.disabled, isIndeterminate],
  );

  return (
    <div className={s.container}>
      <input {...props} ref={inputRef} type={'checkbox'} aria-checked={ariaChecked} className={s.input} />
      <div className={classNameInput}>
        <span className={s.icon}>{isIndeterminate ? <SubtractFillIcon /> : <CheckFillIcon />}</span>
      </div>
    </div>
  );
};
