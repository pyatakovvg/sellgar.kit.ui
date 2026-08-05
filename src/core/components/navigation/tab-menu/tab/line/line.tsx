import React from 'react';

import { Typography } from '../../../../content/typography';

import cn from 'classnames';
import s from './default.module.scss';

interface IProps {
  size?: 'lg' | 'md' | 'sm';
  isActive?: boolean;
  title: string;
  name: string;
  id: string;
  ariaControls: string;
  leadIcon?: React.ReactNode;
  tailIcon?: React.ReactNode;
  badge?: React.ReactNode;
  onClick?(): void;
  disabled?: boolean;
}

export const LineTab: React.FC<IProps> = ({ size = 'lg', ...props }) => {
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
          [s.active]: props.isActive,
          [s.disabled]: props.disabled,
        },
      ),
    [size, props.disabled, props.isActive],
  );

  return (
    <button
      aria-controls={props.ariaControls}
      aria-selected={props.isActive}
      className={className}
      data-tab-menu-tab={'true'}
      data-tab-name={props.name}
      disabled={props.disabled}
      id={props.id}
      role={'tab'}
      tabIndex={props.isActive ? 0 : -1}
      type={'button'}
      onClick={props.onClick}
      data-qa={'tabmenu.menu.line' + props.name}
    >
      {props.leadIcon && <div className={s['lead-icon']}>{props.leadIcon}</div>}
      <div className={s.title} data-qa={'tabmenu.menu.line' + props.name + '.title'}>
        <Typography size={size === 'sm' ? 'caption-l' : 'body-s'} weight={'medium'}>
          <span>{props.title}</span>
        </Typography>
      </div>
      {props.badge && <div className={s.badge}>{props.badge}</div>}
      {props.tailIcon && <div className={s['tail-icon']}>{props.tailIcon}</div>}
    </button>
  );
};
