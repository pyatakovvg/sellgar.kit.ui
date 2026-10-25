import React from 'react';

import { ArrowRightSLineIcon } from '../../../../icons';

import { Typography } from '../../content/typography';
import { Toggle } from '../../controls/toggle';
import { Badge } from '../../status/badge';
import { ExtendedOptionAvatar } from './avatar';

import cn from 'classnames';
import s from './default.module.scss';

type TExtendedOptionSize = 'md' | 'lg';

export interface IExtendedOptionProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children' | 'className'> {
  active?: boolean;
  badge?: React.ReactElement<React.ComponentProps<typeof Badge>, typeof Badge>;
  caption?: React.ReactNode;
  disabled?: boolean;
  expandable?: boolean;
  focused?: boolean;
  hovered?: boolean;
  label: React.ReactNode;
  leadIcon?: React.ReactNode;
  onToggleChange?: React.ChangeEventHandler<HTMLInputElement>;
  size?: TExtendedOptionSize;
  tailIcon?: React.ReactNode;
  toggle?: boolean;
}

const ExtendedOptionComponent: React.FC<IExtendedOptionProps> = ({
  active,
  badge,
  caption,
  disabled,
  expandable,
  focused,
  hovered,
  label,
  leadIcon,
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
  const leadIconClassName = React.useMemo(
    () =>
      cn(s['lead-icon'], {
        [s['lead-icon-surface']]: size === 'lg',
      }),
    [size],
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
      {leadIcon && <div className={leadIconClassName}>{leadIcon}</div>}
      <div className={s.content}>
        {typeof label === 'string' || typeof label === 'number' || typeof label === 'bigint' ? (
          <Typography size={'caption-l'} weight={'regular'}>
            <p className={s.text}>{label}</p>
          </Typography>
        ) : (
          label
        )}
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

type TExtendedOption = typeof ExtendedOptionComponent & {
  Avatar: typeof ExtendedOptionAvatar;
};

export const ExtendedOption: TExtendedOption = Object.assign(ExtendedOptionComponent, {
  Avatar: ExtendedOptionAvatar,
});
