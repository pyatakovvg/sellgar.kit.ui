import React from 'react';

import { Typography } from '../../../content/typography';

import cn from 'classnames';
import s from './default.module.scss';

export interface IProps {
  title: string;
  disabled?: boolean;
}

export const Option: React.FC<IProps> = (props) => {
  const className = React.useMemo(
    () =>
      cn(s.wrapper, {
        [s.disabled]: props.disabled,
      }),
    [props.disabled],
  );

  return (
    <div className={className}>
      <Typography size={'caption-l'} weight={'medium'}>
        <p className={s.text}>{props.title}</p>
      </Typography>
    </div>
  );
};
