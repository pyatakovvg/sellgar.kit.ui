import React from 'react';

import s from './default.module.scss';

import type { TableActionRenderer } from '../../../../../../../configurator/types';

interface IProps {
  action: TableActionRenderer;
  close(): void;
}

export const Action: React.FC<IProps> = (props) => {
  const handleClick = () => {
    if (props.action.disabled) return;
    props.action.onAction();
    props.close();
  };

  return (
    <button className={s.wrapper} type="button" disabled={props.action.disabled} onClick={handleClick}>
      {props.action.render()}
    </button>
  );
};
