import React from 'react';

import { ErrorWarningLineIcon } from '../../../../../icons';

import s from './exception.module.scss';

export const Exception = () => {
  return (
    <div className={s.wrapper}>
      <ErrorWarningLineIcon />
    </div>
  );
};
