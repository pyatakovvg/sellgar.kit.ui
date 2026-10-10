import React from 'react';

import { Typography } from '../../content/typography';

import s from './default.module.scss';

interface IProps {
  depth: number;
  title: string;
}

export const TreeOption: React.FC<IProps> = (props) => {
  const levels = Array.from({ length: props.depth }, (_, level) => `level-${level}`);

  return (
    <div className={s.wrapper}>
      {levels.length > 0 && (
        <div aria-hidden={true} className={s.dots}>
          {levels.map((level) => (
            <span key={level} className={s.dot} />
          ))}
        </div>
      )}
      <div className={s.content}>
        <Typography size={'caption-l'} weight={'medium'}>
          <p className={s.text}>{props.title}</p>
        </Typography>
      </div>
    </div>
  );
};
