import React from 'react';

import { RowContext } from './context/row-context';
import { Line } from './line';
import { Expanded } from './expanded';

import s from './default.module.scss';

import type { TableRowGeometry } from '../../../../../runtime/types';
interface IProps {
  row: TableRowGeometry;
}

export const Row: React.FC<IProps> = (props) => {
  return (
    <RowContext.Provider value={props.row}>
      <div className={s.wrapper} data-table-row={props.row.id}>
        <Line />
        {props.row.expanded && <Expanded />}
      </div>
    </RowContext.Provider>
  );
};
