import React from 'react';

import { useTableEnvironment, useTableSnapshot } from '../../context/table-context';
import { numbers } from '../../serializer/numbers';
import { HeadCell } from './head-cell';

import s from './default.module.scss';

export const Header: React.FC = () => {
  const environment = useTableEnvironment();
  const state = useTableSnapshot();
  const root = React.useRef<HTMLDivElement>(null);
  React.useLayoutEffect(
    () => (root.current ? environment.browser.attachHeader(root.current) : undefined),
    [environment.browser, state.error],
  );

  if (state.error) return null;

  return (
    <div
      id={environment.headerId}
      className={s.wrapper}
      role="rowgroup"
      data-table-header-layer="true"
      style={{
        left: numbers(state.viewport.screenLeft),
        top: numbers(state.viewport.top),
        width: numbers(state.viewport.width),
        height: numbers(state.viewport.height),
      }}
    >
      <div
        ref={root}
        className={s.header}
        role="row"
        aria-rowindex={1}
        data-table-header="true"
        data-dragging={state.dragging}
        style={{
          width: numbers(state.total),
          gridTemplateColumns: state.widths.map(numbers).join(' '),
          transform: `translate(${numbers(-state.viewport.left)}, ${numbers(state.headerTop)})`,
        }}
      >
        {state.columns.map((column) => (
          <HeadCell column={column} key={column.id} />
        ))}
      </div>
    </div>
  );
};
