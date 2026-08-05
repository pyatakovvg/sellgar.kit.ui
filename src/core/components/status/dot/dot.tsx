import React from 'react';

import cn from 'classnames';
import s from './default.module.scss';

interface IProps {
  size?: '2xl' | 'xl' | 'lg' | 'md' | 'sm' | 'xs';
  color?: 'gray' | 'green' | 'blue' | 'orange' | 'red' | 'purple';
}

export const Dot: React.FC<IProps> = ({ size = '2xl', color = 'gray' }) => {
  const className = React.useMemo(
    () =>
      cn(
        s.wrapper,
        {
          [s['size--2xl']]: size === '2xl',
          [s['size--xl']]: size === 'xl',
          [s['size--lg']]: size === 'lg',
          [s['size--md']]: size === 'md',
          [s['size--sm']]: size === 'sm',
          [s['size--xs']]: size === 'xs',
        },
        {
          [s['color--gray']]: color === 'gray',
          [s['color--green']]: color === 'green',
          [s['color--blue']]: color === 'blue',
          [s['color--orange']]: color === 'orange',
          [s['color--red']]: color === 'red',
          [s['color--purple']]: color === 'purple',
        },
      ),
    [size, color],
  );

  return <div className={className} />;
};
