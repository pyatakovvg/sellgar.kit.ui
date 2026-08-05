import React from 'react';

import cn from 'classnames';
import s from './button-icon.module.scss';

export interface IProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'style' | 'className'> {
  ref?: React.Ref<HTMLButtonElement>;
  size?: 'sm' | 'md' | 'lg';
  shape?: 'rounded' | 'pill';
  leadIcon?: React.ReactNode;
}

export const ButtonIcon: React.FC<IProps> = ({ ref, size = 'lg', shape = 'rounded', leadIcon, ...props }) => {
  const classNameButton = React.useMemo(
    () =>
      cn(
        s.wrapper,
        {
          [s['size--lg']]: size === 'lg',
          [s['size--md']]: size === 'md',
          [s['size--sm']]: size === 'sm',
        },
        {
          [s['shape--rounded']]: shape === 'rounded',
          [s['shape--pill']]: shape === 'pill',
        },
      ),
    [size, shape],
  );

  return (
    <button ref={ref} {...props} className={classNameButton}>
      {leadIcon && <div className={s['lead-icon']}>{leadIcon}</div>}
    </button>
  );
};
