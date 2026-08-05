import React from 'react';

import { Typography } from '../../../content/typography';

import cn from 'classnames';
import s from './default.module.scss';

interface IProps {
  isWeekday?: boolean;
}

export const WeekDay: React.FC<React.PropsWithChildren<IProps>> = (props) => {
  const className = React.useMemo(
    () =>
      cn(s.wrapper, {
        [s['is-weekday']]: props.isWeekday,
      }),
    [props.isWeekday],
  );

  return (
    <div className={className}>
      <Typography size={'caption-m'} weight={'medium'}>
        <p>{props.children}</p>
      </Typography>
    </div>
  );
};
