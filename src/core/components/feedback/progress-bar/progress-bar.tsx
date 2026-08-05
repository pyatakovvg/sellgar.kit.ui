import React from 'react';

import cn from 'classnames';
import s from './default.module.scss';

interface IProps extends Omit<React.HTMLProps<HTMLProgressElement>, 'size'> {
  color?: 'green' | 'blue' | 'red' | 'orange';
  size?: 'sm' | 'md' | 'lg';
}

export const ProgressBar: React.FC<React.PropsWithChildren<IProps>> = ({ size = 'md', color = 'blue', ...props }) => {
  const className = React.useMemo(
    () =>
      cn(
        s.progress,
        {
          [s['size--sm']]: size === 'sm',
          [s['size--md']]: size === 'md',
          [s['size--lg']]: size === 'lg',
        },
        {
          [s['color--green']]: color === 'green',
          [s['color--blue']]: color === 'blue',
          [s['color--red']]: color === 'red',
          [s['color--orange']]: color === 'orange',
        },
      ),
    [size, color],
  );

  return <progress className={className} {...props} />;
};
