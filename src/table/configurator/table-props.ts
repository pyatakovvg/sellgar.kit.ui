import React from 'react';

import type { TableData } from './types';

export type TableRowEventTrigger = 'click' | 'doubleClick' | 'contextMenu';

export interface TableRowEventPayload<T> {
  row: T;
  rowIndex: number;
  context: {
    expansion?: { expanded: boolean; toggle(): void };
  };
  trigger: TableRowEventTrigger;
  nativeEvent: React.MouseEvent<HTMLDivElement>;
}

export interface TableRowHandlers<T> {
  click?(payload: TableRowEventPayload<T>): void;
  doubleClick?(payload: TableRowEventPayload<T>): void;
  contextMenu?(payload: TableRowEventPayload<T>): void;
}

export interface TableRowConfig<T> {
  handlers?: TableRowHandlers<T>;
  isInteractiveTarget?(target: EventTarget | null): boolean;
  disableDefaultInteractiveGuard?: boolean;
}

export interface TableSelectConfig<T> {
  isUse: boolean;
  onSelect?(rows: T[]): void;
}

export interface TableTreeConfig<T> {
  isUse: boolean;
  accessor: (row: T) => readonly T[] | null | undefined;
  defaultExpanded?: boolean;
}

export interface TableLastRowTriggerConfig<T> {
  onLastRowVisible(row: T): void;
  rootMargin?: number;
  threshold?: number;
}

export type TableSurface = 'standalone' | 'embedded';
export type TableStyle = 'primary' | 'secondary';
export type TableSize = 'sm' | 'md' | 'lg';
export type TableLayoutScroll = 'internal' | 'external';

export interface TableStickyHeaderConfig {
  top?: string;
}

export interface TableVirtualizationConfig {
  enabled?: boolean;
  rowHeight?: number;
  overscan?: number;
}

export type TableLayoutVirtualization = boolean | TableVirtualizationConfig;

export interface TableLayoutConfig {
  /** Defaults to external; internal scrolling must be enabled explicitly. */
  scroll?: TableLayoutScroll;
  stickyHeader?: boolean | TableStickyHeaderConfig;
  virtualization?: TableLayoutVirtualization;
  /** Center viewport reserve in logical numbers units. Defaults to 50; accepts 0. */
  pinning?: { reserve?: number };
}

export interface TableProps<T extends object> {
  data: TableData<T>;
  /** Shows loading progress while true and completes the indicator when false. */
  loading?: boolean;
  select?: TableSelectConfig<NoInfer<T>>;
  tree?: TableTreeConfig<NoInfer<T>>;
  row?: TableRowConfig<NoInfer<T>>;
  lastRowTrigger?: TableLastRowTriggerConfig<NoInfer<T>>;
  surface?: TableSurface;
  layout?: TableLayoutConfig;
  style?: TableStyle;
  size?: TableSize;
  className?: string;
}
