import React from 'react';

import cn from 'classnames';
import s from './default.module.scss';

export interface IProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  size?: 'sm' | 'md';
}

export const Element: React.FC<IProps> = ({ size = 'md', ...props }) => {
  const classNameIcon = React.useMemo(
    () =>
      cn(s.icon, {
        [s['size--md']]: size === 'md',
        [s['size--sm']]: size === 'sm',
      }),
    [size],
  );

  return (
    <div className={s.wrapper}>
      <input {...props} type={'radio'} className={s.input} />
      <span className={classNameIcon} />
    </div>
  );
};
