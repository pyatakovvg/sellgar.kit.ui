import React from 'react';
import cn from 'classnames';

import { useTableEnvironment } from '../../../context/table-context';
import { isInteractiveTarget } from '../../../interaction/interactive-target';
import { HeadCellContext } from './context/head-cell-context';
import { HeaderActions } from './header-actions';
import { ResizeHandle } from './resize-handle';
import { SortIndicator } from './sort-indicator';

import s from './default.module.scss';

import type { TableColumnGeometry } from '../../../../../runtime/types';

interface IProps {
  column: TableColumnGeometry;
}

export const HeadCell: React.FC<IProps> = (props) => {
  const environment = useTableEnvironment();
  const element = React.useRef<HTMLDivElement>(null);
  React.useLayoutEffect(
    () =>
      element.current && props.column.measureContent
        ? environment.browser.observeHeaderContent(element.current, props.column.id)
        : undefined,
    [environment.browser, props.column.id, props.column.measureContent],
  );
  const align = environment.align(props.column.id);
  const sortable = environment.sortable(props.column.id);
  const hasActions = environment.headerActions(props.column.id).length > 0;
  const direction = environment.sort.columnId === props.column.id ? environment.sort.direction : undefined;
  const isControlTarget = (target: EventTarget | null) =>
    isInteractiveTarget(target) ||
    (target instanceof Element && Boolean(target.closest('[data-table-header-control]')));
  const handleClick: React.MouseEventHandler<HTMLDivElement> = (event) => {
    if (!isControlTarget(event.target)) environment.toggleSort(props.column.id);
  };
  const handleKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (event) => {
    if (event.target !== event.currentTarget || (event.key !== 'Enter' && event.key !== ' ')) return;
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    event.preventDefault();
    if (!event.repeat) environment.toggleSort(props.column.id);
  };
  const wrapperClassName = cn(s.wrapper, s[`size--${environment.size}`], {
    [s.secondary]: environment.tableStyle === 'secondary',
    [s['align--center']]: align === 'center',
    [s['align--right']]: align === 'right',
    [s.resizable]: props.column.resizable,
    [s.sortable]: sortable,
    [s.interactive]: sortable || hasActions,
    [s['with-controls']]: sortable || hasActions,
  });
  const controlsAtStart = align === 'right';
  const controlsClassName = cn(s.controls, { [s['controls--reversed']]: controlsAtStart });
  const controls = (sortable || hasActions) && (
    <div className={controlsClassName}>
      {sortable && <SortIndicator />}
      {hasActions && <HeaderActions />}
    </div>
  );

  return (
    <HeadCellContext.Provider value={props.column}>
      <div
        ref={element}
        className={wrapperClassName}
        role="columnheader"
        tabIndex={sortable ? 0 : undefined}
        aria-sort={
          sortable ? (direction === 'asc' ? 'ascending' : direction === 'desc' ? 'descending' : 'none') : undefined
        }
        onClick={sortable ? handleClick : undefined}
        onKeyDown={sortable ? handleKeyDown : undefined}
        aria-colindex={props.column.index + 1}
        data-column-id={props.column.id}
        data-column-region={props.column.region}
        data-resize-edge={props.column.resizeEdge}
      >
        {controlsAtStart && controls}
        <div className={s.label}>{environment.renderHeader(props.column.id)}</div>
        {!controlsAtStart && controls}
        {props.column.resizable && (
          <div className={s.resize} data-table-header-control="true">
            <ResizeHandle />
          </div>
        )}
      </div>
    </HeadCellContext.Provider>
  );
};
