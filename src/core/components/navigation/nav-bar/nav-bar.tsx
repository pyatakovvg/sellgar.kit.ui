import { Typography } from '../../../components';

import React from 'react';
import cn from 'classnames';

import css from './nav-bar.module.scss';

const NavBarComponent: React.FC<React.PropsWithChildren> = (props) => {
  return <div className={css.wrapper}>{props.children}</div>;
};

type TItem = {
  icon?: React.ReactNode;
  caption: string;
  isActive?: boolean;
};

const Item: React.FC<TItem> = (props) => {
  return (
    <div className={cn(css.item, props.isActive && css.active)}>
      {props.icon && <div className={css.icon}>{props.icon}</div>}

      {props.caption && (
        <div className={css.caption}>
          <Typography size={'caption-s'}>
            <p>{props.caption}</p>
          </Typography>
        </div>
      )}
    </div>
  );
};

type TBottomNavigation = typeof NavBarComponent & {
  Item: typeof Item;
};

export const NavBar: TBottomNavigation = Object.assign(NavBarComponent, {
  Item,
});
