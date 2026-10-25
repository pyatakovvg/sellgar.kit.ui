import React from 'react';

import { CheckLineIcon } from '../../../../../icons';

import { Typography } from '../../../content/typography';
import { Checkbox } from '../../../controls/checkbox';
import { Avatar as KitAvatar } from '../../../media/avatar';
import { Badge } from '../../../status/badge';

import cn from 'classnames';
import s from './default.module.scss';

import type { TSelectOptionSelection } from '../select-option.tsx';

export interface ISelectOptionAvatarProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children' | 'className'> {
  active?: boolean;
  avatar?: React.ReactElement<React.ComponentProps<typeof KitAvatar>, typeof KitAvatar>;
  badge?: React.ReactElement<React.ComponentProps<typeof Badge>, typeof Badge>;
  caption?: React.ReactNode;
  checkboxDataQa?: string;
  disabled?: boolean;
  focused?: boolean;
  hovered?: boolean;
  isIndeterminate?: boolean;
  label: React.ReactNode;
  selected?: boolean;
  selection?: TSelectOptionSelection;
  supportText?: React.ReactNode;
  tailIcon?: React.ReactNode;
}

export const SelectOptionAvatar: React.FC<ISelectOptionAvatarProps> = ({
  active,
  avatar,
  badge,
  caption,
  checkboxDataQa,
  disabled,
  focused,
  hovered,
  isIndeterminate,
  label,
  selected,
  selection = 'single',
  supportText,
  tailIcon,
  ...props
}) => {
  const className = React.useMemo(
    () =>
      cn(s.wrapper, {
        [s.active]: active,
        [s.disabled]: disabled,
        [s.focused]: focused,
        [s.hovered]: hovered,
        [s.selected]: selected,
      }),
    [active, disabled, focused, hovered, selected],
  );
  const isMultiple = selection === 'multiple';
  const isSingleSelected = selection === 'single' && selected;

  return (
    <div {...props} aria-disabled={disabled || props['aria-disabled']} className={className} data-select-option-root>
      {isMultiple && (
        <div className={s.checkbox} data-qa={checkboxDataQa}>
          <Checkbox checked={selected} disabled={disabled} isIndeterminate={isIndeterminate} readOnly size={'sm'} />
        </div>
      )}
      {avatar && (
        <div className={s.avatar}>
          {React.cloneElement(avatar, {
            size: 'xs',
          })}
        </div>
      )}
      <div className={s.content}>
        <div className={s.title}>
          <Typography size={'caption-l'} weight={'regular'}>
            <p className={s.text}>{label}</p>
          </Typography>
          {supportText && (
            <Typography size={'caption-m'} weight={'regular'}>
              <p className={s.support}>{supportText}</p>
            </Typography>
          )}
          {badge && (
            <div className={s.badge}>
              {React.cloneElement(badge, {
                disabled: disabled || badge.props.disabled,
                size: 'xs',
              })}
            </div>
          )}
        </div>
        {caption && (
          <Typography size={'caption-m'} weight={'regular'}>
            <p className={s.caption}>{caption}</p>
          </Typography>
        )}
      </div>
      {tailIcon && <div className={s['tail-icon']}>{tailIcon}</div>}
      {isSingleSelected && (
        <div className={s.check}>
          <CheckLineIcon />
        </div>
      )}
    </div>
  );
};
