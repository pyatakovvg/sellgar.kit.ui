import React from 'react';

import { Scrollbar } from '../../../../layout/scrollbar';

import cn from 'classnames';

import type { TFloatingListElementProps } from '../../../../../systems/floating';

interface IProps {
  children: React.ReactNode;
  className?: string;
  props: TFloatingListElementProps;
}

export const ListScroll: React.FC<IProps> = ({ children, className, props }) => {
  const { className: propsClassName, style: _style, ...scrollProps } = props;

  return (
    <Scrollbar {...scrollProps} className={cn(className, propsClassName)}>
      {children}
    </Scrollbar>
  );
};
