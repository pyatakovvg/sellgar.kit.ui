import React from 'react';

import { Typography, Badge, Toggle } from '../../..';

import cn from 'classnames';
import s from './default.module.scss';

export interface IProps {
  leadIcon?: React.ReactNode;
  active?: boolean;
  label: string;
  badge?: React.ReactNode;
  toggle?: boolean;
}

export const Option: React.FC<IProps> = (props) => {
  const className = React.useMemo(
    () =>
      cn(s.wrapper, {
        [s.active]: props.active,
      }),
    [props.active],
  );

  return (
    <div className={className}>
      {props.leadIcon && <div className={s['lead-icon']}>{props.leadIcon}</div>}
      <div className={s.label}>
        <Typography size={'caption-l'} weight={'medium'}>
          <p className={s.text}>{props.label}</p>
        </Typography>
      </div>
      {props.badge && (
        <div className={s.badge}>
          {React.Children.map(props.badge, (child) => {
            if (React.isValidElement(child)) {
              const badge = child as React.ReactElement<React.ComponentProps<typeof Badge>>;
              return React.cloneElement(badge, { size: 'sm' });
            }
            return child;
          })}
        </div>
      )}
      {props.toggle !== undefined && (
        <div className={s.badge}>
          <Toggle size={'sm'} checked={props.toggle} />
        </div>
      )}
    </div>
  );
};
