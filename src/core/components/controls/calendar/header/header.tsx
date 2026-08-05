import React from 'react';

import { ArrowLeftSLineIcon, ArrowRightSLineIcon } from '../../../../../icons';

import { Typography } from '../../../content/typography';

import s from './default.module.scss';

interface IProps {
  year: number;
  month: string;
  onPrevMonthClick: () => void;
  onNextMonthClick: () => void;
}

export const Header: React.FC<IProps> = (props) => {
  return (
    <div className={s.wrapper}>
      <div className={s.content}>
        <Typography size={'caption-l'} weight={'semi-bold'}>
          <p>
            {props.month} {props.year}
          </p>
        </Typography>
      </div>
      <div className={s.controls}>
        <button
          className={s.icon}
          type={'button'}
          aria-label={'Предыдущий месяц'}
          onClick={() => props.onPrevMonthClick()}
        >
          <ArrowLeftSLineIcon />
        </button>
        <button
          className={s.icon}
          type={'button'}
          aria-label={'Следующий месяц'}
          onClick={() => props.onNextMonthClick()}
        >
          <ArrowRightSLineIcon />
        </button>
      </div>
    </div>
  );
};
