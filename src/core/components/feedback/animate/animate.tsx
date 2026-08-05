import React from 'react';

import cn from 'classnames';
import s from './default.module.scss';

export const AnimateComponent = () => {
  return null;
};

const Spin: React.FC<React.PropsWithChildren> = (props) => {
  return React.Children.map(props.children, (child) => {
    if (React.isValidElement(child)) {
      const childElement = child as React.ReactHTMLElement<React.ComponentProps<any>>;
      return React.cloneElement(childElement, {
        className: cn(s.spin, childElement.props.className),
      });
    }
    return child;
  });
};

type TAnimate = typeof AnimateComponent & {
  Spin: typeof Spin;
};

export const Animate: TAnimate = Object.assign(AnimateComponent, {
  Spin,
});
