import React from 'react';

import { ArrowRightSLineIcon } from '../../../../../icons';

import { Typography } from '../../../content/typography';
import { Toggle } from '../../../controls/toggle';
import { Avatar as KitAvatar } from '../../../media/avatar';
import { Badge } from '../../../status/badge';

import cn from 'classnames';
import s from './default.module.scss';

type TExtendedOptionAvatarSize = 'md' | 'lg';

export interface IExtendedOptionAvatarProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  'children' | 'className'
> {
  active?: boolean;
  avatar?: React.ReactElement<React.ComponentProps<typeof KitAvatar>, typeof KitAvatar>;
  badge?: React.ReactElement<React.ComponentProps<typeof Badge>, typeof Badge>;
  caption?: React.ReactNode;
  disabled?: boolean;
  expandable?: boolean;
  focused?: boolean;
  hovered?: boolean;
  label: React.ReactNode;
  onToggleChange?: React.ChangeEventHandler<HTMLInputElement>;
  size?: TExtendedOptionAvatarSize;
  tailIcon?: React.ReactNode;
  toggle?: boolean;
}

export const ExtendedOptionAvatar: React.FC<IExtendedOptionAvatarProps> = ({
  active,
  avatar,
  badge,
  caption,
  disabled,
  expandable,
  focused,
  hovered,
  label,
  onToggleChange,
  size = 'md',
  tailIcon,
  toggle,
  ...props
}) => {
  const className = React.useMemo(
    () =>
      cn(s.wrapper, {
        [s.active]: active,
        [s.hovered]: hovered,
        [s.focused]: focused,
        [s.disabled]: disabled,
        [s['size--lg']]: size === 'lg',
        [s['size--md']]: size === 'md',
      }),
    [active, disabled, focused, hovered, size],
  );
  const toggleClassName = React.useMemo(
    () =>
      cn(s.toggle, {
        [s['toggle-readonly']]: !onToggleChange,
      }),
    [onToggleChange],
  );

  const handleToggleEvent = React.useCallback((event: React.SyntheticEvent) => {
    event.stopPropagation();
  }, []);

  return (
    <div {...props} aria-disabled={disabled || props['aria-disabled']} className={className}>
      {avatar && (
        <div className={s.avatar}>
          {React.Children.map(avatar, (child) => {
            if (React.isValidElement(child) && child.type === KitAvatar) {
              const avatarElement = child as React.ReactElement<
                React.ComponentProps<typeof KitAvatar>,
                typeof KitAvatar
              >;

              return React.cloneElement(avatarElement, {
                size: size === 'lg' ? 'sm' : 'xs',
              });
            }

            return child;
          })}
        </div>
      )}
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
          {React.Children.map(badge, (child) => {
            if (React.isValidElement(child) && child.type === Badge) {
              const badgeElement = child as React.ReactElement<React.ComponentProps<typeof Badge>, typeof Badge>;

              return React.cloneElement(badgeElement, {
                disabled: disabled || badgeElement.props.disabled,
                size: 'sm',
              });
            }

            return child;
          })}
        </div>
      )}
      {toggle !== void 0 && (
        <div className={toggleClassName} onClick={handleToggleEvent} onKeyDown={handleToggleEvent}>
          <Toggle
            size={'sm'}
            checked={toggle}
            disabled={disabled}
            readOnly={!onToggleChange}
            tabIndex={onToggleChange ? void 0 : -1}
            onChange={onToggleChange}
          />
        </div>
      )}
      {expandable && (
        <div className={s.arrow}>
          <ArrowRightSLineIcon />
        </div>
      )}
    </div>
  );
};
