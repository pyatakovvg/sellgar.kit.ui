import React from 'react';

import cn from 'classnames';
import s from './default.module.scss';

interface IProps {
  size:
    | 'h1'
    | 'h2'
    | 'h3'
    | 'h4'
    | 'h5'
    | 'h6'
    | 'body-l'
    | 'body-m'
    | 'body-s'
    | 'caption-l'
    | 'caption-m'
    | 'caption-s';
  weight?: 'light' | 'regular' | 'medium' | 'semi-bold' | 'bold' | 'extra-bold' | 'black';
}

export const Typography: React.FC<React.PropsWithChildren<IProps>> = ({ weight = 'medium', ...props }) => {
  const className = React.useMemo(
    () =>
      cn(
        {
          [s['font-size__h1']]: props.size === 'h1',
          [s['font-size__h2']]: props.size === 'h2',
          [s['font-size__h3']]: props.size === 'h3',
          [s['font-size__h4']]: props.size === 'h4',
          [s['font-size__h5']]: props.size === 'h5',
          [s['font-size__h6']]: props.size === 'h6',
          [s['font-size__body-l']]: props.size === 'body-l',
          [s['font-size__body-m']]: props.size === 'body-m',
          [s['font-size__body-s']]: props.size === 'body-s',
          [s['font-size__caption-l']]: props.size === 'caption-l',
          [s['font-size__caption-m']]: props.size === 'caption-m',
          [s['font-size__caption-s']]: props.size === 'caption-s',
        },
        {
          [s['font-weight__light']]: weight === 'light',
          [s['font-weight__regular']]: weight === 'regular',
          [s['font-weight__medium']]: weight === 'medium',
          [s['font-weight__semi-bold']]: weight === 'semi-bold',
          [s['font-weight__bold']]: weight === 'bold',
          [s['font-weight__extra-bold']]: weight === 'extra-bold',
          [s['font-weight__black']]: weight === 'black',
        },
      ),
    [props.size, weight],
  );

  return React.Children.map(props.children, (child) => {
    if (React.isValidElement(child)) {
      const childElement = child as React.ReactHTMLElement<never>;
      return React.cloneElement(childElement, {
        className: cn(className, childElement.props.className),
      });
    }
    return child;
  });
};
