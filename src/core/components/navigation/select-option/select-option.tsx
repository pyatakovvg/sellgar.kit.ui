import React from 'react';

import { CheckLineIcon } from '../../../../icons';

import { Typography } from '../../content/typography';
import { Checkbox } from '../../controls/checkbox';
import { Badge } from '../../status/badge';
import { SelectOptionAvatar } from './avatar';

import cn from 'classnames';
import s from './default.module.scss';

export type TSelectOptionSelection = 'single' | 'multiple';

export interface ISelectOptionProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children' | 'className'> {
  active?: boolean;
  badge?: React.ReactElement<React.ComponentProps<typeof Badge>, typeof Badge>;
  caption?: React.ReactNode;
  checkboxDataQa?: string;
  disabled?: boolean;
  focused?: boolean;
  hovered?: boolean;
  isIndeterminate?: boolean;
  label: React.ReactNode;
  leadIcon?: React.ReactNode;
  selected?: boolean;
  selection?: TSelectOptionSelection;
  supportText?: React.ReactNode;
  tailIcon?: React.ReactNode;
}

const SelectOptionComponent: React.FC<ISelectOptionProps> = ({
  active,
  badge,
  caption,
  checkboxDataQa,
  disabled,
  focused,
  hovered,
  isIndeterminate,
  label,
  leadIcon,
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
      {leadIcon && <div className={s['lead-icon']}>{leadIcon}</div>}
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

type TSelectOption = typeof SelectOptionComponent & {
  Avatar: typeof SelectOptionAvatar;
};

export const SelectOption: TSelectOption = Object.assign(SelectOptionComponent, {
  Avatar: SelectOptionAvatar,
});
