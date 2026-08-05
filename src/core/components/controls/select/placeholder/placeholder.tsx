import React from 'react';

import { Typography } from '../../../content/typography';

import s from './default.module.scss';

export interface IProps {
  title: string;
}

export const Placeholder: React.FC<IProps> = (props) => {
  return (
    <div className={s.wrapper}>
      <Typography size={'caption-l'} weight={'regular'}>
        <p className={s.text}>{props.title}</p>
      </Typography>
    </div>
  );
};
