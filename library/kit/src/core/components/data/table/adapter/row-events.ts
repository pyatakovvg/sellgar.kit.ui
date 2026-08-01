import React from 'react';

import type { TableDataLineSnapshot } from '../runtime/types.ts';

export type TableRowEventTrigger = 'click' | 'doubleClick' | 'contextMenu';

export interface TableRowEventPayload<T> {
  row: T;
  rowIndex: number;
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

interface TableRowLineEventHandler<T> {
  (event: React.MouseEvent<HTMLDivElement>, line: TableDataLineSnapshot<T>): void;
}

export interface TableRowEventsAdapter<T> {
  isRowInteractive: boolean;
  onRowClick: TableRowLineEventHandler<T>;
  onRowDoubleClick: TableRowLineEventHandler<T>;
  onRowContextMenu: TableRowLineEventHandler<T>;
}

const DOUBLE_CLICK_DELAY_MS = 220;

const isDefaultInteractiveTarget = (target: EventTarget | null): boolean => {
  if (!(target instanceof Element)) return false;

  return Boolean(target.closest('button, a, input, select, textarea, [role="button"], [data-row-event-ignore]'));
};

export const useTableRowEvents = <T>(config: TableRowConfig<T> | undefined): TableRowEventsAdapter<T> => {
  const clickTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearPendingClick = React.useCallback(() => {
    if (!clickTimeoutRef.current) return;

    clearTimeout(clickTimeoutRef.current);
    clickTimeoutRef.current = null;
  }, []);

  React.useEffect(() => {
    return () => {
      clearPendingClick();
    };
  }, [clearPendingClick]);

  const isRowInteractive = Boolean(
    config?.handlers?.click || config?.handlers?.doubleClick || config?.handlers?.contextMenu,
  );

  const emitRowEvent = React.useCallback(
    (trigger: TableRowEventTrigger, event: React.MouseEvent<HTMLDivElement>, line: TableDataLineSnapshot<T>) => {
      const handler = config?.handlers?.[trigger];

      if (!handler) return;

      const isInteractiveByDefault = config?.disableDefaultInteractiveGuard
        ? false
        : isDefaultInteractiveTarget(event.target);
      const isInteractiveByCustom = config?.isInteractiveTarget?.(event.target) ?? false;

      if (isInteractiveByDefault || isInteractiveByCustom) return;

      handler({
        row: line.node.data,
        rowIndex: line.node.index,
        trigger,
        nativeEvent: event,
      });
    },
    [config],
  );

  const onRowClick = React.useCallback<TableRowLineEventHandler<T>>(
    (event, line) => {
      if (!config?.handlers?.click) return;

      if (!config.handlers.doubleClick) {
        emitRowEvent('click', event, line);
        return;
      }

      clearPendingClick();
      clickTimeoutRef.current = setTimeout(() => {
        emitRowEvent('click', event, line);
        clickTimeoutRef.current = null;
      }, DOUBLE_CLICK_DELAY_MS);
    },
    [clearPendingClick, config, emitRowEvent],
  );

  const onRowDoubleClick = React.useCallback<TableRowLineEventHandler<T>>(
    (event, line) => {
      clearPendingClick();
      emitRowEvent('doubleClick', event, line);
    },
    [clearPendingClick, emitRowEvent],
  );

  const onRowContextMenu = React.useCallback<TableRowLineEventHandler<T>>(
    (event, line) => {
      clearPendingClick();
      emitRowEvent('contextMenu', event, line);
    },
    [clearPendingClick, emitRowEvent],
  );

  return {
    isRowInteractive,
    onRowClick,
    onRowDoubleClick,
    onRowContextMenu,
  };
};
