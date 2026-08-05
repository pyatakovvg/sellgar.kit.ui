import React from 'react';

import { TabList } from '../tab-list';
import type { TTabMenuShape, TTabMenuSize } from '../tab.context.ts';

import cn from 'classnames';
import s from './default.module.scss';

interface IProps {
  children?: React.ReactNode;
  shape?: TTabMenuShape;
  size?: TTabMenuSize;
}

export const Segmented: React.FC<IProps> = ({
  children,
  shape = 'rounded',
  size = 'lg',
}) => {
  const className = React.useMemo(
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
    [shape, size],
  );

  return (
    <TabList
      className={className}
      shape={shape}
      size={size}
      variant={'segmented'}
    >
      {children}
    </TabList>
  );
};
