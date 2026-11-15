import React from 'react';
import cn from 'classnames';

import { useTableEnvironment, useTableSnapshot } from '../../../../context/table-context';
import { useTableRow } from '../context/row-context';
import { Cell } from './cell';

import s from './default.module.scss';

export const Line: React.FC = () => {
  const environment = useTableEnvironment();
  const state = useTableSnapshot();
  const row = useTableRow();
  const selected = React.useSyncExternalStore(
    environment.selection.subscribe,
    () => environment.selection.getRowStatus(row.id).selected,
    () => environment.selection.getRowStatus(row.id).selected,
  );
  const root = React.useRef<HTMLDivElement>(null);
  const latestEnvironment = React.useRef(environment);
  const timer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const wrapperClassName = cn(s.wrapper, { [s.interactive]: environment.interactive, [s.selected]: selected });

  const cancelClick = () => {
    clearTimeout(timer.current);
    timer.current = undefined;
  };

  React.useEffect(() => () => clearTimeout(timer.current), []);
  React.useLayoutEffect(() => {
    latestEnvironment.current = environment;
  }, [environment]);

  const lastRow = row.index === state.rowCount - 1;
  const lastRowEnabled = Boolean(environment.lastRowTrigger) && !state.error;
  const rootMargin = environment.lastRowTrigger?.rootMargin;
  const threshold = environment.lastRowTrigger?.threshold;
  React.useEffect(() => {
    if (!root.current || !lastRow || !lastRowEnabled) return;
    return environment.browser.observeLastRow(
      root.current,
      row.id,
      () => latestEnvironment.current.lastRowVisible(row.id),
      {
        rootMargin,
        threshold,
      },
    );
  }, [
    environment.browser,
    environment.scroll,
    environment.parentBrowser,
    environment.stickyTop,
    lastRow,
    lastRowEnabled,
    row.id,
    row.contentHeight,
    state.scale,
    state.scaleY,
    rootMargin,
    threshold,
  ]);

  const handleClick: React.MouseEventHandler<HTMLDivElement> = (event) => {
    cancelClick();
    if (environment.delayClick && event.detail !== 0) {
      timer.current = setTimeout(() => {
        timer.current = undefined;
        latestEnvironment.current.rowEvent(row.id, 'click', event);
      }, 220);
    } else environment.rowEvent(row.id, 'click', event);
  };

  const handleDoubleClick: React.MouseEventHandler<HTMLDivElement> = (event) => {
    cancelClick();
    environment.rowEvent(row.id, 'doubleClick', event);
  };

  const handleContextMenu: React.MouseEventHandler<HTMLDivElement> = (event) => {
    cancelClick();
    environment.rowEvent(row.id, 'contextMenu', event);
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (event) => {
    if (
      !environment.primaryAction ||
      event.target !== event.currentTarget ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey ||
      (event.key !== 'Enter' && event.key !== ' ')
    )
      return;
    event.preventDefault();
    if (!event.repeat) event.currentTarget.click();
  };

  return (
    <div
      ref={root}
      className={wrapperClassName}
      role="row"
      aria-selected={environment.selection.getSnapshot().enabled ? selected : undefined}
      tabIndex={environment.primaryAction ? 0 : undefined}
      onKeyDown={handleKeyDown}
      aria-rowindex={row.index + 2}
      data-row-id={row.id}
      data-table-line={row.id}
      aria-expanded={row.treeExpanded ?? (environment.expandable ? row.expanded : undefined)}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onContextMenu={handleContextMenu}
    >
      {state.columns.map((column) => (
        <Cell row={row} column={column} key={column.id} />
      ))}
    </div>
  );
};
