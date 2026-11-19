import React from 'react';

import { Checkbox } from '../../../../core/components/controls/checkbox';
import { useTableEnvironment } from '../context/table-context';

import s from './default.module.scss';

interface IProps {
  rowId?: string;
}

export const SelectionCheckbox: React.FC<IProps> = (props) => {
  const { selection } = useTableEnvironment();
  const getStatus = () => (props.rowId === undefined ? selection.getSnapshot() : selection.getRowStatus(props.rowId));
  const status = React.useSyncExternalStore(selection.subscribe, getStatus, getStatus);
  const checked = 'allSelected' in status ? status.allSelected : status.selected;
  const handleChange = () => (props.rowId === undefined ? selection.toggleAll() : selection.toggle(props.rowId));

  return (
    <div className={s.wrapper}>
      <Checkbox
        size={'sm'}
        checked={checked}
        isIndeterminate={status.indeterminate}
        aria-checked={status.indeterminate ? 'mixed' : checked}
        aria-label={props.rowId === undefined ? 'Выбрать все строки' : 'Выбрать строку'}
        onChange={handleChange}
      />
    </div>
  );
};
