import React from 'react';

import { Badge } from '../../status/badge';

import cn from 'classnames';
import s from './default.module.scss';

export interface IProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'style' | 'className'> {
  ref?: React.Ref<HTMLButtonElement>;
  size?: 'md' | 'sm' | 'xs';
  target?: 'default' | 'destructive' | 'success' | 'info';
  leadIcon?: React.ReactNode;
  tailIcon?: React.ReactNode;
  badge?: React.ReactNode;
}

const useBadgeSize = (size: IProps['size']) => {
  return React.useMemo(() => {
    switch (size) {
      case 'md':
        return 'md';
      case 'sm':
        return 'sm';
      case 'xs':
        return 'xs';
    }
  }, [size]);
};

const useBadgeColor = (target: IProps['target']) => {
  return React.useMemo(() => {
    switch (target) {
      case 'default':
        return 'gray';
      case 'destructive':
        return 'red';
      case 'info':
        return 'blue';
      case 'success':
        return 'green';
    }
  }, [target]);
};

export const ButtonLink: React.FC<IProps> = ({
  ref,
  size = 'md',
  target = 'default',
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
          [s['size--md']]: size === 'md',
          [s['size--sm']]: size === 'sm',
          [s['size--xs']]: size === 'xs',
        },
        {
          [s['target--info']]: target === 'info',
          [s['target--success']]: target === 'success',
          [s['target--destructive']]: target === 'destructive',
        },
      ),
    [size, target],
  );

  const badgeSize = useBadgeSize(size);
  const badgeColor = useBadgeColor(target);

  return (
    <button ref={ref} {...props} className={classNameButton}>
      {leadIcon && <div className={s['lead-icon']}>{leadIcon}</div>}

      {props.children && <div className={s.text}>{props.children}</div>}
      {badge && (
        <div className={s.badge}>
          {React.Children.map(badge, (child) => {
            if (React.isValidElement(child)) {
              const childElement = child as React.ReactElement<React.ComponentProps<typeof Badge>>;
              return React.cloneElement(childElement, {
                size: badgeSize,
                color: badgeColor,
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
