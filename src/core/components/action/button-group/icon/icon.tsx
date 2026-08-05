import React from 'react';

import cn from 'classnames';
import s from './icon.module.scss';

export interface IProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'style'> {
  isActive?: boolean;
  size?: 'sm' | 'md' | 'lg';
  shape?: 'rounded' | 'pill';
  leadIcon?: React.ReactNode;
}

export const Icon: React.FC<IProps> = ({ isActive = false, size = 'lg', shape = 'rounded', leadIcon, ...props }) => {
  const classNameButton = React.useMemo(
    () =>
      cn(
        s.wrapper,
        {
          [s['active']]: isActive,
        },
        {
          [s['size--large']]: size === 'lg',
          [s['size--medium']]: size === 'md',
          [s['size--small']]: size === 'sm',
        },
        {
          [s['shape--rounded']]: shape === 'rounded',
          [s['shape--pill']]: shape === 'pill',
        },
      ),
    [size, shape, isActive],
  );

  return (
    <button {...props} className={classNameButton}>
      {leadIcon && <div className={s['lead-icon']}>{leadIcon}</div>}
    </button>
  );
};
