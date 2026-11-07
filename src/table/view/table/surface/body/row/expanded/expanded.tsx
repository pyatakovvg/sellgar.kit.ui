import React from 'react';

import { ExpandedTableContext, useTableEnvironment, useTableSnapshot } from '../../../../context/table-context';
import { useTableRow } from '../context/row-context';

import s from './default.module.scss';

export const Expanded: React.FC = () => {
  const environment = useTableEnvironment();
  const state = useTableSnapshot();
  const row = useTableRow();
  const root = React.useRef<HTMLDivElement>(null);
  React.useLayoutEffect(
    () => (root.current ? environment.browser.observeExpanded(root.current, row.id, state.version) : undefined),
    [environment.browser, row.id, state.version],
  );

  return (
    <div ref={root} className={s.wrapper} data-table-expanded={row.id}>
      <ExpandedTableContext.Provider value={environment.browser}>
        {environment.renderExpanded(row.id)}
      </ExpandedTableContext.Provider>
    </div>
  );
};
