import React from 'react';

import { PopoverSurface } from './popover-surface';
import { SheetSurface } from './sheet-surface';

import type { TResolvedFloatingPresentation } from '../../../../systems/floating';
import type { TFloatingListElementProps } from '../../../../systems/floating';

interface IProps {
  actionLabel?: React.ReactNode;
  children: React.ReactNode;
  listProps: TFloatingListElementProps;
  placeholder: React.ReactNode;
  presentation: TResolvedFloatingPresentation;
  props: TFloatingListElementProps;
  onClose(): void;
}

export const Surface: React.FC<IProps> = ({
  actionLabel,
  children,
  listProps,
  placeholder,
  presentation,
  props,
  onClose,
}) => {
  if (presentation === 'sheet') {
    return (
      <SheetSurface
        actionLabel={actionLabel}
        listProps={listProps}
        placeholder={placeholder}
        props={props}
        onClose={onClose}
      >
        {children}
      </SheetSurface>
    );
  }

  return (
    <PopoverSurface listProps={listProps} props={props}>
      {children}
    </PopoverSurface>
  );
};
