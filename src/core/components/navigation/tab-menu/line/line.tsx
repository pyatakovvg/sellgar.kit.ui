import React from 'react';

import { TabList } from '../tab-list';
import type { TTabMenuSize } from '../tab.context.ts';

import cn from 'classnames';
import s from './default.module.scss';

interface IProps {
  children?: React.ReactNode;
  size?: TTabMenuSize;
}

export const Line: React.FC<IProps> = ({ children, size = 'lg' }) => {
  const className = React.useMemo(
    () =>
      cn(s.wrapper, {
        [s['size--lg']]: size === 'lg',
        [s['size--md']]: size === 'md',
        [s['size--sm']]: size === 'sm',
      }),
    [size],
  );

  return (
    <TabList
      className={className}
      shape={'rounded'}
      size={size}
      variant={'line'}
    >
      {children}
    </TabList>
  );
};
