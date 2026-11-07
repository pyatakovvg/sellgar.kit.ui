import React from 'react';
import cn from 'classnames';

import { useTableEnvironment, useTableSnapshot } from '../../../../context/table-context';
import { numbers } from '../../../../serializer/numbers';
import { useTableRow } from '../context/row-context';
import { Cell } from './cell';

import s from './default.module.scss';

export const Line: React.FC = () => {
  const environment = useTableEnvironment();
  const state = useTableSnapshot();
  const row = useTableRow();
  const timer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const wrapperClassName = cn(s.wrapper, { [s.interactive]: environment.interactive });

  const cancelClick = () => {
    clearTimeout(timer.current);
    timer.current = undefined;
  };

  React.useEffect(() => () => clearTimeout(timer.current), []);

  const handleClick: React.MouseEventHandler<HTMLDivElement> = (event) => {
    cancelClick();
    if (environment.delayClick) {
      timer.current = setTimeout(() => {
        timer.current = undefined;
        environment.rowEvent(row.id, 'click', event);
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

  return (
    <div
      className={wrapperClassName}
      role="row"
      aria-rowindex={row.index + 2}
      data-row-id={row.id}
      aria-expanded={environment.expandable ? row.expanded : undefined}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onContextMenu={handleContextMenu}
      style={{ height: numbers(row.contentHeight), gridTemplateColumns: state.widths.map(numbers).join(' ') }}
    >
      {state.columns.map((column) => (
        <Cell row={row} column={column} key={column.id} />
      ))}
    </div>
  );
};
