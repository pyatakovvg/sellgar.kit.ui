import React from 'react';
import cn from 'classnames';

import { useTableEnvironment } from '../../../../../context/table-context';

import { ExpandTrigger } from './expand-trigger';
import { TreeTrigger } from './tree-trigger/index.ts';

import s from './default.module.scss';

import type { TableColumnGeometry, TableRowGeometry } from '../../../../../../../runtime/types';

interface IProps {
  row: TableRowGeometry;
  column: TableColumnGeometry;
}

export const Cell: React.FC<IProps> = (props) => {
  const environment = useTableEnvironment();
  const content = React.useRef<HTMLDivElement>(null);
  const align = environment.align(props.column.id);
  const wrapperClassName = cn(s.wrapper, {
    [s.separated]: props.row.index > 0,
    [s['align--center']]: align === 'center',
    [s['align--right']]: align === 'right',
  });
  React.useLayoutEffect(
    () =>
      content.current
        ? environment.browser.observeCell(content.current, props.row.id, props.column.id, props.column.measureContent)
        : undefined,
    [environment.browser, props.row.id, props.column.id, props.column.measureContent],
  );
  return (
    <div
      className={wrapperClassName}
      role="cell"
      aria-colindex={props.column.index + 1}
      data-column-id={props.column.id}
      data-column-region={props.column.region}
    >
      <div ref={content} className={s.content}>
        {environment.renderCell(props.row, props.column, ExpandTrigger, TreeTrigger)}
      </div>
    </div>
  );
};
