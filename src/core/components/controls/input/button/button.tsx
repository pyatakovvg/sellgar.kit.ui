import React from 'react';

import { Loader4LineIcon } from '../../../../../icons';

import { Animate } from '../../../feedback/animate';
import { ButtonIcon } from './button-icon';

import cn from 'classnames';
import s from './default.module.scss';

export interface IProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'style'> {
  buttonType?: 'borderless' | 'default';
  size?: 'md' | 'xs';
  tailIcon?: React.ReactNode;
  inProcess?: boolean;
}

export const ButtonComponent: React.FC<IProps> = ({
  size = 'md',
  buttonType = 'default',
  tailIcon,
  inProcess,
  ...props
}) => {
  const classNameButton = React.useMemo(
    () =>
      cn(
        s.wrapper,
        {
          [s['size--md']]: size === 'md',
          [s['size--xs']]: size === 'xs',
        },
        {
          [s['type--default']]: buttonType === 'default',
          [s['type--borderless']]: buttonType === 'borderless',
        },
      ),
    [size, buttonType],
  );

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (inProcess) {
      return void 0;
    }
    props.onClick?.(event);
  };

  const textClassName = React.useMemo(
    () =>
      cn(s.text, {
        [s['hidden']]: inProcess,
      }),
    [inProcess],
  );
  const tailIconClassName = React.useMemo(
    () =>
      cn(s['tail-icon'], {
        [s['hidden']]: inProcess,
      }),
    [inProcess],
  );

  return (
    <button {...props} className={classNameButton} onClick={handleClick}>
      {props.children && <div className={textClassName}>{props.children}</div>}
      {tailIcon && <div className={tailIconClassName}>{tailIcon}</div>}

      {inProcess && (
        <div className={s.spinner}>
          <Animate.Spin>
            <div className={s['tail-icon']}>
              <Loader4LineIcon />
            </div>
          </Animate.Spin>
        </div>
      )}
    </button>
  );
};

type TButton = typeof ButtonComponent & {
  Icon: typeof ButtonIcon;
};

export const Button: TButton = Object.assign(ButtonComponent, {
  Icon: ButtonIcon,
});
