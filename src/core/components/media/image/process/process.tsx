import React from 'react';

import { Loader4LineIcon } from '../../../../../icons';

import { Animate } from '../../../feedback/animate';

import s from './process.module.scss';

export const Process = () => {
  return (
    <div className={s.wrapper}>
      <Animate.Spin>
        <Loader4LineIcon />
      </Animate.Spin>
    </div>
  );
};
