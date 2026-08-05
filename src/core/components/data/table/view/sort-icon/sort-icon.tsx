import React from 'react';

import { ArrowDownSFillIcon, ArrowUpSFillIcon, ExpandUpDownIcon } from '../../shared';

import s from './default.module.scss';

import type { TableColumnSortSnapshot } from '../../runtime';

interface TableSortIconViewProps {
  sort: TableColumnSortSnapshot;
}

export const TableSortIconView = (props: TableSortIconViewProps) => {
  return (
    <span className={s.sortIcon} aria-hidden="true">
      {!props.sort.direction && <ExpandUpDownIcon />}
      {props.sort.direction === 'asc' && <ArrowUpSFillIcon />}
      {props.sort.direction === 'desc' && <ArrowDownSFillIcon />}
    </span>
  );
};
