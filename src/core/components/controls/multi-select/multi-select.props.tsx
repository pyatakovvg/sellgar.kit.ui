import React from 'react';
import { Button } from '../../action/button';

export interface MultiSelectProps<T extends Record<string, any>, K extends keyof T> {
  leadIcon?: React.ReactNode;
  tailIcon?: React.ReactNode;
  fixHeight?: boolean;
  optionKey: K;
  optionValue: K;
  options: T[];
  badge?: React.ReactNode;
  value?: T[K][];
  tabIndex?: number;
  disabled?: boolean;
  templateValue?(option: T): React.ReactNode;
  templateOption?(option: T): React.ReactNode;

  // Новые пропсы для MultiSelect
  selectAllText?: string;
  selectAllEnabled?: boolean;

  mobileHeader?: React.ReactNode;

  onChange?: (value: T[K][]) => void;
  onFocus?: () => void;
  onBlur?: () => void;

  renderBadge?: (option: T, onRemove: () => void) => React.ReactNode;
}

export interface IMultiSelectInputProps<T extends Record<string, any>, K extends keyof T> extends MultiSelectProps<
  T,
  K
> {
  size?: 'xs' | 'md';
  target?: 'destructive';
  placeholder?: string;
  isClearable?: boolean;
  maxDisplayBadges?: number;
}

export interface IMultiSelectButtonProps<T extends Record<string, any>, K extends keyof T> extends MultiSelectProps<
  T,
  K
> {
  size?: React.ComponentProps<typeof Button>['size'];
  style?: React.ComponentProps<typeof Button>['style'];
  target?: React.ComponentProps<typeof Button>['target'];
  shape?: React.ComponentProps<typeof Button>['shape'];
  children?: React.ReactNode;
}
