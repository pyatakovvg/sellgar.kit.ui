import React from 'react';

import { Typography } from '../../../content/typography';

import cn from 'classnames';
import s from './default.module.scss';

interface IProps {
  ref?: React.Ref<HTMLButtonElement>;
  isActive?: boolean;
  isToday?: boolean;
  isWeekday?: boolean;
  tabIndex?: number;
  onKeyDown?(event: React.KeyboardEvent<HTMLButtonElement>): void;
  onClick(): void;
}

export const Day: React.FC<React.PropsWithChildren<IProps>> = (props) => {
  const className = React.useMemo(
    () =>
      cn(s.container, {
        [s['is-active']]: props.isActive,
        [s['is-today']]: props.isToday,
        [s['is-weekday']]: props.isWeekday,
      }),
    [props.isActive, props.isToday, props.isWeekday],
  );

  return (
    <button
      ref={props.ref}
      className={s.wrapper}
      type={'button'}
      tabIndex={props.tabIndex}
      onClick={props.onClick}
      onKeyDown={props.onKeyDown}
    >
      <div className={className}>
        <Typography size={'caption-l'} weight={'medium'}>
          <p>{props.children}</p>
        </Typography>
      </div>
    </button>
  );
};
