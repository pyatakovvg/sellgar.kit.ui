import React from 'react';

import { BadgeDot } from './dot';

import cn from 'classnames';
import s from './default.module.scss';

export type TBadgeColor =
  | 'gray'
  | 'blue'
  | 'green'
  | 'red'
  | 'orange'
  | 'purple'
  | 'white'
  | 'surface'
  | 'white-destructive'
  | 'surface-destructive'
  | 'white-info'
  | 'surface-info'
  | 'white-success'
  | 'surface-success'
  | 'brand';
export type TBadgeSize = 'lg' | 'md' | 'sm' | 'xs';
export type TBadgeShape = 'rounded' | 'pill';
export type TBadgeState = 'default' | 'disabled' | 'hover' | 'on-click';

export interface IProps {
  color?: TBadgeColor;
  state?: TBadgeState;
  size?: TBadgeSize;
  shape?: TBadgeShape;
  stroke?: boolean;
  outlined?: boolean;
  disabled?: boolean;
  leadIcon?: React.ReactNode;
  tailIcon?: React.ReactNode;
  label: string | number;
}

const BadgeComponent: React.FC<IProps> = ({
  color = 'gray',
  disabled = false,
  leadIcon,
  label,
  outlined = false,
  shape = 'rounded',
  size = 'md',
  state = 'default',
  stroke = false,
  tailIcon,
}) => {
  const isDisabled = disabled || state === 'disabled';

  const classNameBadge = React.useMemo(
    () =>
      cn(
        s.wrapper,
        {
          [s['color--gray']]: color === 'gray',
          [s['color--blue']]: color === 'blue',
          [s['color--green']]: color === 'green',
          [s['color--orange']]: color === 'orange',
          [s['color--red']]: color === 'red',
          [s['color--purple']]: color === 'purple',
          [s['color--white']]: color === 'white',
          [s['color--surface']]: color === 'surface',
          [s['color--white-destructive']]: color === 'white-destructive',
          [s['color--surface-destructive']]: color === 'surface-destructive',
          [s['color--white-info']]: color === 'white-info',
          [s['color--surface-info']]: color === 'surface-info',
          [s['color--white-success']]: color === 'white-success',
          [s['color--surface-success']]: color === 'surface-success',
          [s['color--brand']]: color === 'brand',
        },
        {
          [s['size--lg']]: size === 'lg',
          [s['size--md']]: size === 'md',
          [s['size--sm']]: size === 'sm',
          [s['size--xs']]: size === 'xs',
        },
        {
          [s['shape--rounded']]: shape === 'rounded',
          [s['shape--pill']]: shape === 'pill',
        },
        {
          [s.stroke]: stroke,
          [s.outlined]: outlined,
          [s.disabled]: isDisabled,
          [s['state--hover']]: state === 'hover',
          [s['state--on-click']]: state === 'on-click',
        },
      ),
    [color, isDisabled, outlined, shape, size, state, stroke],
  );

  return (
    <div className={classNameBadge}>
      {leadIcon && <div className={s['lead-icon']}>{leadIcon}</div>}
      <div className={s.label}>{label}</div>
      {tailIcon && <div className={s['tail-icon']}>{tailIcon}</div>}
    </div>
  );
};

type TBadge = typeof BadgeComponent & {
  Dot: typeof BadgeDot;
};

export const Badge: TBadge = Object.assign(BadgeComponent, {
  Dot: BadgeDot,
});
