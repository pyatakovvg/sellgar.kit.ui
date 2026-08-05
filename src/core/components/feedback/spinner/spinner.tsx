import React from 'react';

import { Loader4FillIcon } from '../../../../icons';

import { Animate } from '../animate';

import s from './default.module.scss';

export const Spinner: React.FC = () => {
  return (
    <Animate.Spin>
      <span className={s.wrapper}>
        <Loader4FillIcon />
      </span>
    </Animate.Spin>
  );
};
