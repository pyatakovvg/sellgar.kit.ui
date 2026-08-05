import React from 'react';
import cn from 'classnames';

import { Icon, TIconName } from '../../content/icon';

import css from './modal-icon.module.css';

type Props = {
  type?: 'success' | 'error' | 'warning' | 'default';
  shape?: 'pill' | 'rounded';
  size?: 'xl' | 's';
  icon: TIconName;
};

export const ModalIcon: React.FC<Props> = ({ type = 'default', icon, size = 'xl', shape = 'rounded' }) => {
  return (
    <div
      className={cn(
        css.wrapper,
        type === 'success' ? css.success : type === 'error' ? css.error : type === 'warning' ? css.warning : null,
        shape === 'pill' ? css.pill : shape === 'rounded' ? css.rounded : null,
        size === 'xl' ? css.xlarge : size === 's' ? css.small : null,
      )}
    >
      <div className={css.icon}>
        <Icon icon={icon} />
      </div>
    </div>
  );
};
