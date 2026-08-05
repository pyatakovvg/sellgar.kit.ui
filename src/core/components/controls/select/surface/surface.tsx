import React from 'react';

import { PopoverSurface } from './popover-surface';
import { SheetSurface } from './sheet-surface';

import type { TResolvedFloatingPresentation } from '../../../../systems/floating';
import type { TFloatingListElementProps } from '../../../../systems/floating';

interface IProps {
  children: React.ReactNode;
  listProps: TFloatingListElementProps;
  placeholder: string | undefined;
  presentation: TResolvedFloatingPresentation;
  props: TFloatingListElementProps;
  onClose(): void;
}

export const Surface: React.FC<IProps> = ({
  children,
  listProps,
  placeholder,
  presentation,
  props,
  onClose,
}) => {
  if (presentation === 'sheet') {
    return (
      <SheetSurface listProps={listProps} placeholder={placeholder} props={props} onClose={onClose}>
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
