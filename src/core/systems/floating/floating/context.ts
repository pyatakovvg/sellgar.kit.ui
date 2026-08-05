import React from 'react';

import type { ElementProps, ReferenceType, UseFloatingReturn } from '@floating-ui/react';

import type { TFloatingOpenChangeReason, TResolvedFloatingPresentation } from './floating.tsx';

export interface IFloatingContentOptions {
  matchReferenceWidth: boolean;
  maxWidth?: number | string;
  minWidth?: number | string;
}

export interface IFloatingReferenceInteraction {
  id: string;
  interaction: ElementProps;
}

export interface IFloatingContext {
  contentOptionsRef: React.MutableRefObject<IFloatingContentOptions>;
  disabled: boolean;
  floating: UseFloatingReturn<ReferenceType>;
  getFloatingProps(props?: React.HTMLAttributes<HTMLElement>): React.HTMLAttributes<HTMLElement>;
  getReferenceProps(props?: React.HTMLAttributes<Element>): React.HTMLAttributes<Element>;
  guards: boolean;
  initialFocus: number;
  isFocused: boolean;
  isKeyboardFocused: boolean;
  lockScroll: boolean;
  modal: boolean;
  open: boolean;
  presentation: TResolvedFloatingPresentation;
  referenceInteractionsRef: React.MutableRefObject<readonly IFloatingReferenceInteraction[]>;
  removeReferenceInteraction(id: string): void;
  returnFocus: boolean;
  setFocused(focused: boolean): void;
  setKeyboardFocused(focused: boolean): void;
  setOpen(open: boolean, reason: TFloatingOpenChangeReason): void;
  setReferenceInteraction(interaction: IFloatingReferenceInteraction): void;
  visuallyHiddenDismiss?: boolean | string;
  withOverlay: boolean;
}

export const FloatingContext = React.createContext<IFloatingContext | null>(null);

export const useFloatingContext = (): IFloatingContext => {
  const context = React.useContext(FloatingContext);

  if (context === null) {
    throw new Error('Floating components must be wrapped in <Floating />');
  }

  return context;
};
