import React from 'react';

import { ArrowDownSFillIcon, ArrowUpSFillIcon, ExpandUpDownIcon } from '../../../../../../../icons';
import { useTableEnvironment } from '../../../../context/table-context';
import { useHeadCellColumn } from '../context/head-cell-context';

import s from './default.module.scss';

export const SortIndicator: React.FC = () => {
  const environment = useTableEnvironment();
  const column = useHeadCellColumn();
  const direction = environment.sort.columnId === column.id ? environment.sort.direction : undefined;

  return (
    <span className={s.wrapper} aria-hidden={true}>
      {!direction && <ExpandUpDownIcon />}
      {direction === 'asc' && <ArrowUpSFillIcon />}
      {direction === 'desc' && <ArrowDownSFillIcon />}
    </span>
  );
};
