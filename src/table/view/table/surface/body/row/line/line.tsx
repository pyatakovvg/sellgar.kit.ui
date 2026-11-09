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
  const root = React.useRef<HTMLDivElement>(null);
  const latestEnvironment = React.useRef(environment);
  const timer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const wrapperClassName = cn(s.wrapper, { [s.interactive]: environment.interactive });

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
  const firstColumnId = state.columns.find((column) => column.width > 0)?.id;
  const rootMargin = environment.lastRowTrigger?.rootMargin;
  const threshold = environment.lastRowTrigger?.threshold;
  React.useEffect(() => {
    if (!root.current || !lastRow || !lastRowEnabled) return;
    const cell = Array.from(root.current.children).find(
      (element) => element instanceof HTMLElement && element.dataset.columnId === firstColumnId,
    );
    if (!(cell instanceof HTMLElement)) return;
    return environment.browser.observeLastRow(cell, row.id, () => latestEnvironment.current.lastRowVisible(row.id), {
      rootMargin,
      threshold,
    });
  }, [
    environment.browser,
    environment.scroll,
    environment.parentBrowser,
    environment.stickyTop,
    lastRow,
    lastRowEnabled,
    row.id,
    row.contentHeight,
    state.viewport.scale,
    state.viewport.scaleY,
    firstColumnId,
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
