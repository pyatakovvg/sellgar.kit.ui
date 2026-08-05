import React from 'react';

import cn from 'classnames';
import s from './default.module.scss';

interface IProps {
  size?: 'sm' | 'md';
}

export const Balloon: React.FC<React.PropsWithChildren<IProps>> = (props) => {
  const className = React.useMemo(
    () =>
      cn(s.wrapper, {
        [s['size--sm']]: props.size === 'sm',
        [s['size--md']]: props.size === 'md',
      }),
    [props.size],
  );

  return <div className={className}>{props.children}</div>;
};
