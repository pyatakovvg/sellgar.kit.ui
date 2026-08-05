import React from 'react';
import cn from 'classnames';

import { Icon } from './icon';
import { Button } from './button';

import s from './button-group.module.scss';

interface IProps {
  size?: 'sm' | 'md' | 'lg';
  fill?: 'contain' | 'auto';
  shape?: 'rounded' | 'pill';
  disabled?: boolean;
  children:
    | React.ReactElement<React.ComponentProps<typeof Button> | React.ComponentProps<typeof Icon>>[]
    | React.ReactElement<React.ComponentProps<typeof Button> | React.ComponentProps<typeof Icon>>;
}

const ButtonGroupComponent: React.FC<IProps> = ({ children, fill = 'auto', ...props }) => {
  return (
    <div className={cn(s.wrapper, fill === 'contain' && s.contain)} data-qa={'button-group'}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          const cloneChild = child as React.ReactElement<
            React.ComponentProps<typeof Button> | React.ComponentProps<typeof Icon>
          >;

          return React.cloneElement(cloneChild, props);
        }
        return child;
      })}
    </div>
  );
};

type TButtonGroup = typeof ButtonGroupComponent & {
  Icon: typeof Icon;
  Button: typeof Button;
};

export const ButtonGroup: TButtonGroup = Object.assign(ButtonGroupComponent, {
  Icon,
  Button,
});
