import React from 'react';

import { Loader4LineIcon } from '../../../../../icons';

import { Animate } from '../../../feedback/animate';

import cn from 'classnames';
import s from './default.module.scss';

export interface IProps extends Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  'style' | 'className' | 'children'
> {
  ref?: React.Ref<HTMLButtonElement>;
  style?: 'primary' | 'secondary' | 'tertiary' | 'ghost';
  size?: 'lg' | 'md' | 'sm' | 'xs';
  target?: 'default' | 'destructive' | 'success' | 'info';
  shape?: 'rounded' | 'pill';
  leadIcon?: React.ReactNode;
  inProcess?: boolean;
}

export const ButtonIcon: React.FC<IProps> = ({
  ref,
  size = 'md',
  style = 'primary',
  shape = 'rounded',
  target = 'default',
  leadIcon,
  inProcess,
  ...props
}) => {
  const classNameButton = React.useMemo(
    () =>
      cn(
        s.wrapper,
        {
          [s['size--lg']]: size === 'lg',
          [s['size--md']]: size === 'md',
          [s['size--sm']]: size === 'sm',
          [s['size--xs']]: size === 'xs',
        },
        {
          [s['style--primary']]: style === 'primary',
          [s['style--secondary']]: style === 'secondary',
          [s['style--tertiary']]: style === 'tertiary',
          [s['style--ghost']]: style === 'ghost',
        },
        {
          [s['target--info']]: target === 'info',
          [s['target--success']]: target === 'success',
          [s['target--destructive']]: target === 'destructive',
        },
        {
          [s['shape--rounded']]: shape === 'rounded',
          [s['shape--pill']]: shape === 'pill',
        },
      ),
    [size, style, target, shape],
  );

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (inProcess) {
      event.preventDefault();
      event.stopPropagation();
      return void 0;
    }
    props.onClick?.(event);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (inProcess) {
      event.preventDefault();
      event.stopPropagation();
      return void 0;
    }
    props.onKeyDown?.(event);
  };

  const handleMouseDown = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (inProcess) {
      event.preventDefault();
      event.stopPropagation();
      return void 0;
    }
    props.onMouseDown?.(event);
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (inProcess) {
      event.preventDefault();
      event.stopPropagation();
      return void 0;
    }
    props.onPointerDown?.(event);
  };

  const ariaBusy = inProcess ? true : props['aria-busy'];
  const ariaDisabled = inProcess ? true : props['aria-disabled'];

  const leadIconClassName = React.useMemo(
    () =>
      cn(s['lead-icon'], {
        [s['hidden']]: inProcess,
      }),
    [inProcess],
  );

  return (
    <button
      ref={ref}
      {...props}
      aria-busy={ariaBusy}
      aria-disabled={ariaDisabled}
      className={classNameButton}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onMouseDown={handleMouseDown}
      onPointerDown={handlePointerDown}
    >
      {leadIcon && <div className={leadIconClassName}>{leadIcon}</div>}
      {inProcess && (
        <div className={s.spinner}>
          <Animate.Spin>
            <div className={s['lead-icon']}>
              <Loader4LineIcon />
            </div>
          </Animate.Spin>
        </div>
      )}
    </button>
  );
};
