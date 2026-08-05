import React from 'react';

import { Loader4LineIcon } from '../../../../../../icons';

import { Animate } from '../../../../feedback/animate';

import cn from 'classnames';
import s from './default.module.scss';

export interface IProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'style'> {
  size?: 'md' | 'xs';
  leadIcon: React.ReactNode;
  inProcess?: boolean;
}

export const ButtonIcon: React.FC<IProps> = ({ size = 'md', leadIcon, inProcess, ...props }) => {
  const classNameButton = React.useMemo(
    () =>
      cn(s.wrapper, {
        [s['size--md']]: size === 'md',
        [s['size--xs']]: size === 'xs',
      }),
    [size],
  );

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (inProcess) {
      return void 0;
    }
    props.onClick?.(event);
  };

  const leadIconClassName = React.useMemo(
    () =>
      cn(s['lead-icon'], {
        [s['hidden']]: inProcess,
      }),
    [inProcess],
  );

  return (
    <button {...props} className={classNameButton} onClick={handleClick}>
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
