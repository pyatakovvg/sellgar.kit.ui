import React from 'react';

import { Dot } from '../../dot';

import cn from 'classnames';
import s from './default.module.scss';

type TDotColor = React.ComponentProps<typeof Dot>['color'];
type TDotSize = React.ComponentProps<typeof Dot>['size'];
type TBadgeDotSize = 'lg' | 'md' | 'sm' | 'xs';
type TBadgeDotState = 'default' | 'disabled';

export interface IProps {
  disabled?: boolean;
  dotColor?: TDotColor;
  label: string | number;
  size?: TBadgeDotSize;
  state?: TBadgeDotState;
}

const dotSizeByBadgeSize: Record<TBadgeDotSize, TDotSize> = {
  lg: 'sm',
  md: 'sm',
  sm: 'sm',
  xs: 'xs',
};

export const BadgeDot: React.FC<IProps> = ({
  disabled = false,
  dotColor = 'green',
  label,
  size = 'md',
  state = 'default',
}) => {
  const isDisabled = disabled || state === 'disabled';
  const dotColorValue = isDisabled ? 'gray' : dotColor;

  const classNameBadge = React.useMemo(
    () =>
      cn(
        s.wrapper,
        {
          [s['size--lg']]: size === 'lg',
          [s['size--md']]: size === 'md',
          [s['size--sm']]: size === 'sm',
          [s['size--xs']]: size === 'xs',
        },
        {
          [s.disabled]: isDisabled,
        },
      ),
    [isDisabled, size],
  );

  return (
    <div className={classNameBadge}>
      <div className={s['lead-icon']}>
        <Dot color={dotColorValue} size={dotSizeByBadgeSize[size]} />
      </div>
      <div className={s.label}>{label}</div>
    </div>
  );
};
