import React from 'react';
import cn from 'classnames';

import { useTableEnvironment } from '../../../context/table-context';
import { HeadCellContext } from './context/head-cell-context';
import { HeaderActions } from './header-actions';
import { ResizeHandle } from './resize-handle';

import s from './default.module.scss';

import type { TableColumnGeometry } from '../../../../../runtime/types';

interface IProps {
  column: TableColumnGeometry;
}

export const HeadCell: React.FC<IProps> = (props) => {
  const environment = useTableEnvironment();
  const align = environment.align(props.column.id);
  const wrapperClassName = cn(s.wrapper, s[`size--${environment.size}`], {
    [s.secondary]: environment.tableStyle === 'secondary',
    [s['align--center']]: align === 'center',
    [s['align--right']]: align === 'right',
    [s.resizable]: props.column.resizable,
  });

  return (
    <HeadCellContext.Provider value={props.column}>
      <div
        className={wrapperClassName}
        role="columnheader"
        aria-colindex={props.column.index + 1}
        data-column-id={props.column.id}
        data-column-region={props.column.region}
      >
        <div className={s.label}>{environment.renderHeader(props.column.id)}</div>
        {environment.headerActions(props.column.id).length > 0 && <HeaderActions />}
        {props.column.resizable && (
          <div className={s.resize}>
            <ResizeHandle />
          </div>
        )}
      </div>
    </HeadCellContext.Provider>
  );
};
