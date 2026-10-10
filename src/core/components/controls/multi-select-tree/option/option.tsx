import React from 'react';

import { Checkbox } from '../../checkbox';
import { TreeOption } from '../../tree-option';

import s from './default.module.scss';

interface IProps {
  depth: number;
  title: string;
  checked: boolean;
  indeterminate: boolean;
  disabled?: boolean;
  children?: React.ReactNode;
}

export const Option: React.FC<IProps> = (props) => {
  return (
    <div className={s.wrapper}>
      <div aria-hidden={true} className={s.checkbox}>
        <Checkbox
          checked={props.checked}
          isIndeterminate={props.indeterminate}
          disabled={props.disabled}
          readOnly={true}
          tabIndex={-1}
        />
      </div>
      <div className={s.content}>{props.children ?? <TreeOption depth={props.depth} title={props.title} />}</div>
    </div>
  );
};
