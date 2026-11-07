import React from 'react';

import { useTableSnapshot } from '../../../context/table-context';
import { numbers } from '../../../serializer/numbers';
import { RowContext } from './context/row-context';
import { Line } from './line';
import { Expanded } from './expanded';

import s from './default.module.scss';

import type { TableRowGeometry } from '../../../../../runtime/types';
interface IProps {
  row: TableRowGeometry;
}

export const Row: React.FC<IProps> = (props) => {
  const state = useTableSnapshot();

  return (
    <RowContext.Provider value={props.row}>
      <div
        className={s.wrapper}
        style={{ top: numbers(props.row.top), height: numbers(props.row.height), width: numbers(state.total) }}
      >
        <Line />
        {props.row.expanded && <Expanded />}
      </div>
    </RowContext.Provider>
  );
};
