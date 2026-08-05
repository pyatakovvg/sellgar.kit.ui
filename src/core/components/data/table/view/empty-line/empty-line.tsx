import React from 'react';

import cn from 'classnames';
import s from './default.module.scss';

import type { TableEmptyLineSnapshot } from '../../runtime';

type TableEmptyLineViewSize = 'sm' | 'md' | 'lg';

interface TableEmptyLineViewProps {
  line: TableEmptyLineSnapshot;
  rowIndex: number;
  size: TableEmptyLineViewSize;
  renderEmpty(): React.ReactNode;
}

export const TableEmptyLineView = (props: TableEmptyLineViewProps) => {
  return (
    <div className={s.emptyLine} role="row" aria-rowindex={props.rowIndex}>
      <div
        className={cn(s.emptyCell, {
          [s['size--lg']]: props.size === 'lg',
          [s['size--md']]: props.size === 'md',
          [s['size--sm']]: props.size === 'sm',
        })}
        role="cell"
        aria-colindex={1}
        style={{ gridColumn: `span ${props.line.columnSpan}` }}
      >
        {props.renderEmpty()}
      </div>
    </div>
  );
};
