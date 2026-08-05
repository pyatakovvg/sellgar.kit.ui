import React from 'react';

import { Button } from '../../../../action/button';

import s from './default.module.scss';

interface IProps {
  onApply: () => void;
  onCancel: () => void;
}

export const Controls: React.FC<IProps> = (props) => {
  return (
    <div className={s.wrapper}>
      <div className={s.button}>
        <Button type={'button'} style={'secondary'} size={'sm'} onClick={() => props.onCancel()}>
          Отмена
        </Button>
      </div>
      <div className={s.button}>
        <Button type={'button'} style={'primary'} size={'sm'} onClick={() => props.onApply()}>
          Применить
        </Button>
      </div>
    </div>
  );
};
