import React from 'react';
import cn from 'classnames';

import { Divider as DividerComponent } from '../../../components';

import s from './default.module.css';

type SidebarProps = {
  open?: boolean;
};

const SidebarComponent: React.FC<React.PropsWithChildren<SidebarProps>> = (props) => {
  const [open, setOpen] = React.useState(props.open);

  const handleOver = React.useCallback(() => {
    if (props.open == null) setOpen(true);
  }, [props.open]);

  const handleOut = React.useCallback(() => {
    if (props.open == null) setOpen(false);
  }, [props.open]);

  return (
    <div className={s.wrapper} onMouseOver={handleOver} onMouseOut={handleOut}>
      <div className={cn(s.container, open && s.open)}>{props.children}</div>
    </div>
  );
};

const State: React.FC<React.PropsWithChildren> = (props) => {
  return <div className={s.state}>{props.children}</div>;
};

const Collapsed: React.FC<React.PropsWithChildren> = (props) => {
  return <div className={s.collapsed}>{props.children}</div>;
};

const Expanded: React.FC<React.PropsWithChildren> = (props) => {
  return <div className={s.expanded}>{props.children}</div>;
};

const Top: React.FC<React.PropsWithChildren> = (props) => {
  return <div className={s.top}>{props.children}</div>;
};

const Middle: React.FC<React.PropsWithChildren> = (props) => {
  return <div className={s.middle}>{props.children}</div>;
};

const Bottom: React.FC<React.PropsWithChildren> = (props) => {
  return <div className={s.bottom}>{props.children}</div>;
};

const Cell: React.FC<React.PropsWithChildren> = (props) => {
  return <div className={s.cell}>{props.children}</div>;
};

const SubCells: React.FC<React.PropsWithChildren> = (props) => {
  return <div className={s['sub-cells']}>{props.children}</div>;
};

const Additional: React.FC<React.PropsWithChildren> = (props) => {
  return <div className={s.additional}>{props.children}</div>;
};

const Block: React.FC<React.PropsWithChildren> = (props) => {
  return <div className={s.block}>{props.children}</div>;
};

const Divider: React.FC = () => {
  return (
    <div className={s.divider}>
      <DividerComponent />
    </div>
  );
};

type TSidebar = typeof SidebarComponent & {
  Top: typeof Top;
  Middle: typeof Middle;
  Bottom: typeof Bottom;
  Divider: typeof Divider;
  Cell: typeof Cell;
  SubCells: typeof SubCells;
  Additional: typeof Additional;
  Block: typeof Block;
  Collapsed: typeof Collapsed;
  Expanded: typeof Expanded;
  State: typeof State;
};

export const Sidebar: TSidebar = Object.assign(SidebarComponent, {
  Top,
  Middle,
  Bottom,
  Divider,
  Cell,
  SubCells,
  Additional,
  Block,
  Collapsed,
  Expanded,
  State,
});
