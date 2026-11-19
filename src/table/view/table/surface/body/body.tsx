import React from 'react';

import { useTableEnvironment, useTableSnapshot } from '../../context/table-context';
import { Row } from './row';

import s from './default.module.scss';

export const Body: React.FC = () => {
  const environment = useTableEnvironment();
  const state = useTableSnapshot();
  return (
    <div id={`${environment.headerId}-body`} className={s.wrapper} role="rowgroup" data-table-body="true">
      {state.rows.map((row) => (
        <Row row={row} key={row.id} />
      ))}
    </div>
  );
};
