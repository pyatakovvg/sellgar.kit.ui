import React from 'react';

import cn from 'classnames';
import s from './default.module.scss';

interface IProps extends Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  'children' | 'className' | 'disabled' | 'type'
> {
  size?: 'xl' | 'lg' | 'md' | 'sm';
  shape?: 'rounded' | 'pill';
  isSelected?: boolean;
  isStatic?: boolean;
  disabled?: boolean;
  leadIcon?: React.ReactNode;
  tailIcon?: React.ReactNode;
  label: React.ReactNode;
}

export const Chip: React.FC<IProps> = ({
  disabled = false,
  isStatic = false,
  label,
  leadIcon,
  isSelected = false,
  shape = 'rounded',
  size = 'md',
  tailIcon,
  ...props
}) => {
  const classNameChip = React.useMemo(
    () =>
      cn(
        s.wrapper,
        {
          [s['size--xl']]: size === 'xl',
          [s['size--lg']]: size === 'lg',
          [s['size--md']]: size === 'md',
          [s['size--sm']]: size === 'sm',
        },
        {
          [s['shape--rounded']]: shape === 'rounded',
          [s['shape--pill']]: shape === 'pill',
        },
        {
          [s.selected]: isSelected,
          [s.static]: isStatic,
          [s.disabled]: disabled,
        },
      ),
    [disabled, isSelected, isStatic, shape, size],
  );

  return (
    <button
      {...props}
      className={classNameChip}
      disabled={disabled}
      tabIndex={isStatic ? -1 : props.tabIndex}
      type={'button'}
      onClick={isStatic ? void 0 : props.onClick}
      onKeyDown={isStatic ? void 0 : props.onKeyDown}
    >
      {leadIcon && <div className={s['lead-icon']}>{leadIcon}</div>}
      <div className={s.label}>{label}</div>
      {tailIcon && <div className={s['tail-icon']}>{tailIcon}</div>}
    </button>
  );
};
