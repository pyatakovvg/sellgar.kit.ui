import React from 'react';

import { Badge } from '../../../status/badge';

import cn from 'classnames';
import s from './button.module.scss';

type TBadgeProps = React.ComponentProps<typeof Badge>;

export interface IProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'style'> {
  isActive?: boolean;
  size?: 'sm' | 'md' | 'lg';
  shape?: 'rounded' | 'pill';
  leadIcon?: React.ReactNode;
  tailIcon?: React.ReactNode;
  badge?: React.ReactNode;
}

const useBadgeSize = (size: IProps['size']): TBadgeProps['size'] => {
  return React.useMemo(() => {
    switch (size) {
      case 'lg':
        return 'md';
      case 'md':
      case 'sm':
        return 'sm';
    }
  }, [size]);
};

export const Button: React.FC<IProps> = ({
  isActive = false,
  size = 'lg',
  shape = 'rounded',
  leadIcon,
  tailIcon,
  badge,
  ...props
}) => {
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

  const badgeSize = useBadgeSize(size);

  return (
    <button {...props} className={classNameButton}>
      {leadIcon && <div className={s['lead-icon']}>{leadIcon}</div>}
      <div className={s.text}>{props.children}</div>
      {badge && (
        <div className={s.badge}>
          {React.Children.map(badge, (child) => {
            if (React.isValidElement(child)) {
              const childElement = child as React.ReactElement<TBadgeProps>;

              return React.cloneElement(childElement, {
                size: badgeSize,
                color: childElement.props.color || 'gray',
                stroke: true,
                disabled: props.disabled,
              });
            }

            return child;
          })}
        </div>
      )}
      {tailIcon && <div className={s['tail-icon']}>{tailIcon}</div>}
    </button>
  );
};
