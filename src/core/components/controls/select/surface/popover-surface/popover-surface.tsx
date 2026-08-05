import React from 'react';

import { ListScroll } from '../../list-scroll';
import { DropDownWrapper } from '../../../../../systems/floating';

import cn from 'classnames';
import s from './popover-surface.module.scss';

import type { TFloatingListElementProps } from '../../../../../systems/floating';

interface IProps {
  children: React.ReactNode;
  listProps: TFloatingListElementProps;
  props: TFloatingListElementProps;
}

export const PopoverSurface: React.FC<IProps> = ({ children, listProps, props }) => {
  return (
    <DropDownWrapper {...props} className={cn(s.wrapper, props.className)}>
      <ListScroll className={s.content} props={listProps}>
        {children}
      </ListScroll>
    </DropDownWrapper>
  );
};
