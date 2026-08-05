import React from 'react';

import cn from 'classnames';
import s from './default.module.scss';

interface IProps extends React.HTMLAttributes<HTMLDivElement> {
  ref?: React.Ref<HTMLDivElement | null>;
}

export const DropDownWrapper: React.FC<React.PropsWithChildren<IProps>> = ({ ref, ...props }) => {
  const { children, className, ...restProps } = props;

  return (
    <div className={cn(s.wrapper, className)} {...restProps} ref={ref}>
      {children}
    </div>
  );
};
