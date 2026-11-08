import React from 'react';

import { useTableEnvironment } from '../../../../../../context/table-context';
import { useTableRow } from '../../../context/row-context';

import s from './default.module.scss';

import type { TableExpandTriggerProps } from '../../../../../../../../configurator/types';

export const ExpandTrigger: React.FC<TableExpandTriggerProps> = (props) => {
  const environment = useTableEnvironment();
  const row = useTableRow();

  return (
    <button
      className={s.wrapper}
      type="button"
      aria-expanded={row.expanded}
      disabled={!environment.expandable}
      onClick={() => environment.browser.toggleExpanded(row.id)}
    >
      {typeof props.children === 'function' ? props.children({ expanded: row.expanded }) : props.children}
    </button>
  );
};
