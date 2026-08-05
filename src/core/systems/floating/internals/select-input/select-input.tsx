import React from 'react';

import { ArrowDropDownLineIcon, ArrowDropUpLineIcon, CloseCircleFillIcon } from '../../../../../icons';

import { Badge } from '../../../../components';

import cn from 'classnames';
import s from './default.module.scss';

export interface IProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'className'> {
  ref?: React.Ref<HTMLDivElement>;
  leadIcon?: React.ReactNode;
  tailIcon?: React.ReactNode;
  badge?: React.ReactNode;
  size?: 'xs' | 'md';
  target?: 'destructive';
  disabled?: boolean;
  isOpen?: boolean;
  isFocused?: boolean;
  isKeyboardFocused?: boolean;
  isClearable?: boolean;
  fixHeight?: boolean;
  onClear?(): void;
}

export const SelectInput: React.FC<React.PropsWithChildren<IProps>> = ({
  children,
  ref,
  fixHeight = true,
  size = 'md',
  target,
  leadIcon,
  tailIcon,
  badge,
  isOpen,
  isFocused,
  isKeyboardFocused,
  isClearable,
  disabled,
  role = 'combobox',
  tabIndex,
  onClear,
  ...props
}) => {
  const className = React.useMemo(
    () =>
      cn(
        s.wrapper,
        {
          [s['focused']]: isFocused,
          [s['keyboard-focused']]: isKeyboardFocused,
        },
        {
          [s['size--medium']]: size === 'md',
          [s['size--extra-small']]: size === 'xs',
        },
        {
          [s['disabled']]: disabled,
        },
        {
          [s['destructive']]: target === 'destructive',
        },
        {
          [s['fix-height']]: fixHeight,
        },
      ),
    [isFocused, isKeyboardFocused, size, target, disabled, fixHeight],
  );

  const handleClearable = (event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();

    onClear && onClear();
  };

  return (
    <div
      ref={ref}
      {...props}
      aria-disabled={disabled || props['aria-disabled']}
      className={className}
      role={role}
      tabIndex={disabled ? -1 : (tabIndex ?? 0)}
    >
      {leadIcon && <div className={s['lead-icon']}>{leadIcon}</div>}
      <div className={s.content}>{children}</div>
      {badge && (
        <div className={s.badge}>
          {React.Children.map(badge, (child) => {
            if (React.isValidElement(child)) {
              const badge = child as React.ReactElement<React.ComponentProps<typeof Badge>>;

              return React.cloneElement(badge, { size: 'sm', disabled });
            }
            return child;
          })}
        </div>
      )}
      {tailIcon && <div className={s['tail-icon']}>{tailIcon}</div>}
      {isClearable && (
        <div className={s.clearable} onClick={handleClearable}>
          <CloseCircleFillIcon />
        </div>
      )}
      <div className={s.arrow}>{isOpen ? <ArrowDropUpLineIcon /> : <ArrowDropDownLineIcon />}</div>
    </div>
  );
};
