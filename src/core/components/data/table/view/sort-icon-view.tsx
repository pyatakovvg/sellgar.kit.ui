import React from 'react';

import { ArrowDownSFillIcon, ArrowUpSFillIcon, ExpandUpDownIcon } from '../../../../../icons';

import s from './header-cell-view.module.scss';

import type { TableColumnSortSnapshot } from '../runtime/types.ts';

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
