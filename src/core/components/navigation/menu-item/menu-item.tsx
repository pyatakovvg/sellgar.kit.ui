import React from 'react';

import { Loader4LineIcon } from '../../../../icons';

import { Animate } from '../../feedback/animate';
import { IBadgeProps, Typography } from '../../..';

import cn from 'classnames';
import s from './default.module.scss';

interface IProps {
  leadIcon?: React.ReactNode;
  tailIcon?: React.ReactNode;
  caption?: string;
  isActive?: boolean;
  isPending?: boolean;
  badge?: React.ReactElement;
}

const MenuItemComponent: React.FC<IProps> = (props) => {
  const className = React.useMemo(
    () =>
      cn(s.wrapper, {
        [s.active]: props.isActive,
      }),
    [props.isActive],
  );

  return (
    <div className={className}>
      {props.leadIcon && <div className={s['lead-icon']}>{props.leadIcon}</div>}
      <div className={s.content}>
        <div className={s.caption}>
          <Typography size={'caption-l'} weight={'semi-bold'}>
            <p>{props.caption}</p>
          </Typography>
        </div>
        {props.badge && (
          <div className={s.badge}>
            {React.cloneElement(props.badge, {
              size: 'xs',
              stroke: true,
              color: 'orange',
            } as IBadgeProps)}
          </div>
        )}
      </div>
      {props.isPending ? (
        <Animate.Spin>
          <div className={cn(s['tail-icon'], s['spinner'])}>
            <Loader4LineIcon />
          </div>
        </Animate.Spin>
      ) : (
        props.tailIcon && <div className={cn(s['tail-icon'], s['spinner'])}>{props.tailIcon}</div>
      )}
    </div>
  );
};

const MenuItemIcon: React.FC<IProps> = (props) => {
  const className = React.useMemo(
    () =>
      cn(s.wrapper, s['wrapper-only-icon'], {
        [s.active]: props.isActive,
      }),
    [props.isActive],
  );

  return <div className={className}>{props.leadIcon && <div className={s['lead-icon']}>{props.leadIcon}</div>}</div>;
};

type TMenuItem = typeof MenuItemComponent & {
  Icon: typeof MenuItemIcon;
};

export const MenuItem: TMenuItem = Object.assign(MenuItemComponent, {
  Icon: MenuItemIcon,
});
