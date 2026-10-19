import React from 'react';

import { Typography } from '../../../content/typography';

import cn from 'classnames';
import s from './default.module.scss';

interface IProps {
  ref?: React.Ref<HTMLButtonElement>;
  isActive?: boolean;
  isToday?: boolean;
  isWeekday?: boolean;
  isDisabled?: boolean;
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
        [s['is-disabled']]: props.isDisabled,
      }),
    [props.isActive, props.isDisabled, props.isToday, props.isWeekday],
  );

  const isEmphasized = !!props.isToday || (!!props.isDisabled && !!props.isActive);

  return (
    <button
      ref={props.ref}
      className={s.wrapper}
      type={'button'}
      disabled={props.isDisabled}
      tabIndex={props.tabIndex}
      onClick={props.onClick}
      onKeyDown={props.onKeyDown}
    >
      <div className={className}>
        <Typography size={'caption-l'} weight={isEmphasized ? 'extra-bold' : 'medium'}>
          <p>{props.children}</p>
        </Typography>
      </div>
    </button>
  );
};
