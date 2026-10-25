import React from 'react';

import { ArrowDownSLineIcon, ArrowUpSLineIcon } from '../../../../../../../../icons';
import { Button } from '../../../../../../action/button';
import { ExtendedOption } from '../../../../../../navigation/extended-option';
import { Checkbox } from '../../../../../checkbox';

interface IProps extends Omit<
  React.ComponentProps<typeof ExtendedOption>,
  'children' | 'className' | 'style' | 'leadIcon' | 'tailIcon' | 'toggle' | 'onToggleChange' | 'expandable'
> {
  checked: boolean;
  indeterminate?: boolean;
  expanded?: boolean;
  onCheck(): void;
  onToggle?(): void;
}

export const TreeOption: React.FC<IProps> = ({
  checked,
  disabled,
  indeterminate,
  expanded,
  onCheck,
  onToggle,
  ...props
}) => {
  return (
    <ExtendedOption
      {...props}
      disabled={disabled && expanded === void 0}
      onClick={(event) => {
        props.onClick?.(event);
        if (event.target instanceof Element && event.target.closest('label')) event.stopPropagation();
      }}
      onPointerDownCapture={(event) => {
        props.onPointerDownCapture?.(event);
        if (event.target instanceof Element && event.target.closest('label')) event.preventDefault();
      }}
      onKeyDown={(event) => {
        props.onKeyDown?.(event);
        if (event.target instanceof HTMLInputElement && (event.key === 'Enter' || event.key === ' '))
          event.stopPropagation();
      }}
      leadIcon={
        <Checkbox
          aria-hidden={true}
          checked={checked}
          disabled={disabled}
          isIndeterminate={indeterminate}
          size={'sm'}
          tabIndex={-1}
          onChange={onCheck}
        />
      }
      tailIcon={
        expanded === void 0 ? (
          void 0
        ) : (
          <Button.Icon
            aria-label={expanded ? 'Свернуть ветвь' : 'Раскрыть ветвь'}
            leadIcon={expanded ? <ArrowUpSLineIcon /> : <ArrowDownSLineIcon />}
            size={'xs'}
            style={'ghost'}
            tabIndex={-1}
            type={'button'}
            onPointerDown={(event) => event.preventDefault()}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') event.stopPropagation();
            }}
            onClick={(event) => {
              event.stopPropagation();
              onToggle?.();
            }}
          />
        )
      }
    />
  );
};
