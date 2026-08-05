import React from 'react';

import s from './default.module.scss';

import type { TableExpandedLineSnapshot } from '../../runtime';

interface TableExpandedLineViewProps<T> {
  line: TableExpandedLineSnapshot<T>;
  rowIndex: number;
  renderExpanded(line: TableExpandedLineSnapshot<T>): React.ReactNode;
}

export const TableExpandedLineView = <T,>(props: TableExpandedLineViewProps<T>) => {
  return (
    <div className={s.expandedLine} role="row" aria-rowindex={props.rowIndex}>
      <div
        className={s.expandedContainer}
        role="cell"
        aria-colindex={1}
        style={{ gridColumn: `span ${props.line.columnSpan}` }}
      >
        {props.renderExpanded(props.line)}
      </div>
    </div>
  );
};
