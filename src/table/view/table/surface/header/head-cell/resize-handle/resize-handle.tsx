import React from 'react';

import { useTableEnvironment } from '../../../../context/table-context';
import { useHeadCellColumn } from '../context/head-cell-context';

import s from './default.module.scss';

export const ResizeHandle: React.FC = () => {
  const environment = useTableEnvironment();
  const column = useHeadCellColumn();

  return (
    <button
      className={s.wrapper}
      type="button"
      aria-label={`Изменить ширину колонки ${column.index + 1}`}
      data-resize-column={column.id}
      onKeyDown={(event) => {
        if (event.altKey || event.ctrlKey || event.metaKey || (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight'))
          return;
        event.preventDefault();
        environment.browser.resizeByKey(column.id, (event.key === 'ArrowLeft' ? -1 : 1) * (event.shiftKey ? 10 : 1));
      }}
      onKeyUp={(event) => {
        if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
        event.preventDefault();
        environment.browser.finishKeyResize(column.id);
      }}
      onBlur={() => environment.browser.finishKeyResize(column.id, true)}
      onPointerDown={(event) => environment.browser.beginResize(column.id, event.nativeEvent)}
    >
      <div className={s.indicator} data-direction="left" aria-hidden="true" />
      <div className={s.indicator} data-direction="right" aria-hidden="true" />
    </button>
  );
};
