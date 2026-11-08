import React from 'react';

import { ArrowDownSFillIcon, ArrowRightSFillIcon } from '../../../../../../../../../icons';
import { useTableEnvironment } from '../../../../../../context/table-context';
import { useTableRow } from '../../../context/row-context';

import s from './default.module.scss';

export const TreeTrigger: React.FC = () => {
  const { browser } = useTableEnvironment();
  const row = useTableRow();
  return (
    <button
      type="button"
      className={s.wrapper}
      aria-expanded={row.treeExpanded}
      aria-label={row.treeExpanded ? 'Свернуть строку' : 'Развернуть строку'}
      onClick={() => browser.toggleTree(row.id)}
    >
      {row.treeExpanded ? <ArrowDownSFillIcon /> : <ArrowRightSFillIcon />}
    </button>
  );
};
