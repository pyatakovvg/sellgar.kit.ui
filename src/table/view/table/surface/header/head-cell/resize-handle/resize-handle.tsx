import React from 'react';

import { useTableEnvironment } from '../../../../context/table-context';
import { useHeadCellColumn } from '../context/head-cell-context';

import s from './default.module.scss';

export const ResizeHandle: React.FC = () => {
  const environment = useTableEnvironment();
  const column = useHeadCellColumn();
  const description = `Влево ${column.left ? 'можно' : 'нельзя'}, вправо ${column.right ? 'можно' : 'нельзя'}`;

  return (
    <button
      className={s.wrapper}
      type="button"
      aria-label={`Изменить ширину колонки ${column.index + 1}`}
      aria-description={description}
      title={description}
      aria-disabled={!column.left && !column.right}
      data-resize-column={column.id}
      onKeyDown={(event) => {
        if (event.altKey || event.ctrlKey || event.metaKey || (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight'))
          return;
        event.preventDefault();
        environment.browser.resizeBy(column.id, (event.key === 'ArrowLeft' ? -1 : 1) * (event.shiftKey ? 10 : 1));
      }}
      onPointerDown={(event) => environment.browser.beginResize(column.id, event.nativeEvent)}
    >
      <div className={s.indicator} data-direction="left" data-available={column.left} aria-hidden="true" />
      <div className={s.indicator} data-direction="right" data-available={column.right} aria-hidden="true" />
    </button>
  );
};
