import React from 'react';

import cn from 'classnames';
import s from './default.module.scss';

export const LinkTypography: React.FC<React.PropsWithChildren> = (props) => {
  return React.Children.map(props.children, (child) => {
    if (React.isValidElement(child)) {
      const childElement = child as React.ReactHTMLElement<never>;
      return React.cloneElement(childElement, {
        className: cn(s.wrapper, childElement.props.className),
      });
    }
    return child;
  });
};
