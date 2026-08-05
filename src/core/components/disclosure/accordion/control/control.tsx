import React from 'react';

import { AddLineIcon, SubtractLineIcon } from '../../../../../icons';

import s from './default.module.scss';

interface IProps {
  label: React.ReactNode;
  isExpanded: boolean;
}

export const Control: React.FC<IProps> = (props) => {
  return (
    <div className={s.wrapper}>
      <div className={s.content}>{props.label}</div>
      <div className={s['expand-icon']}>
        {props.isExpanded ? <SubtractLineIcon /> : <AddLineIcon />}
      </div>
    </div>
  );
};
