import React from 'react';
import ReactSlider, { ReactSliderProps } from 'react-slider';

import s from './default.module.scss';

interface IProps extends ReactSliderProps {}

export const Slider: React.FC<IProps> = (props) => {
  return (
    <div className={s.wrapper}>
      <ReactSlider className={s.slider} thumbClassName={s.thumb} trackClassName={s.track} {...props} />
    </div>
  );
};
