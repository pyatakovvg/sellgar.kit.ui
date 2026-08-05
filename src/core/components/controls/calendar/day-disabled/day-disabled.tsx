import React from 'react';

import { Typography } from '../../../content/typography';

import s from './default.module.scss';

interface IProps {}

export const DayDisabled: React.FC<React.PropsWithChildren<IProps>> = (props) => {
  return (
    <div className={s.wrapper}>
      <div className={s.container}>
        <Typography size={'caption-l'} weight={'medium'}>
          <p>{props.children}</p>
        </Typography>
      </div>
    </div>
  );
};
