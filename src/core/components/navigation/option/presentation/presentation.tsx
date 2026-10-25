import React from 'react';

import { ArrowRightSLineIcon } from '../../../../../icons';

import { Typography } from '../../../content/typography';
import { Badge } from '../../../status/badge';

import cn from 'classnames';
import s from './default.module.scss';

export interface IOptionPresentationProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children' | 'className'> {
  leadIcon?: React.ReactNode;
  tailIcon?: React.ReactNode;
  disabled?: boolean;
  label: React.ReactNode;
  caption?: React.ReactNode;
  badge?: React.ReactElement<React.ComponentProps<typeof Badge>, typeof Badge>;
  toggleSlot?: React.ReactNode;
  isToggleReadonly?: boolean;
  expandable?: boolean;
}

export const OptionPresentation: React.FC<IOptionPresentationProps> = ({
  badge,
  caption,
  disabled,
  expandable,
  isToggleReadonly,
  label,
  leadIcon,
  tailIcon,
  toggleSlot,
  ...props
}) => {
  const className = React.useMemo(
    () =>
      cn(s.wrapper, {
        [s.disabled]: disabled,
      }),
    [disabled],
  );
  const toggleClassName = React.useMemo(
    () =>
      cn(s.toggle, {
        [s['toggle-readonly']]: isToggleReadonly,
      }),
    [isToggleReadonly],
  );

  return (
    <div {...props} className={className}>
      {leadIcon && <div className={s['lead-icon']}>{leadIcon}</div>}
      <div className={s.content}>
        <Typography size={'caption-l'} weight={'regular'}>
          <p className={s.text}>{label}</p>
        </Typography>
        {caption && (
          <Typography size={'caption-m'} weight={'regular'}>
            <p className={s.caption}>{caption}</p>
          </Typography>
        )}
      </div>
      {tailIcon && <div className={s['tail-icon']}>{tailIcon}</div>}
      {badge && (
        <div className={s.badge}>
          {React.cloneElement(badge, {
            disabled: disabled || badge.props.disabled,
            size: 'sm',
          })}
        </div>
      )}
      {toggleSlot && <div className={toggleClassName}>{toggleSlot}</div>}
      {expandable && (
        <div className={s.arrow} data-option-arrow>
          <ArrowRightSLineIcon />
        </div>
      )}
    </div>
  );
};
