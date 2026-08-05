import React from 'react';

import { Typography } from '../../content/typography';
import { Element } from './element';

import cn from 'classnames';
import s from './default.module.scss';

export interface IProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  size?: 'sm' | 'md';
  label?: string;
  caption?: string;
}

export const Radio: React.FC<IProps> = ({ size = 'md', label, caption, ...props }) => {
  const classNameInput = React.useMemo(
    () =>
      cn(
        s.wrapper,
        {
          [s['size--medium']]: size === 'md',
          [s['size--small']]: size === 'sm',
        },
        {
          [s['with-label']]: label,
        },
      ),
    [size, label],
  );

  return (
    <div className={s.container}>
      <label className={classNameInput}>
        <div className={s.element}>
          <Element {...props} size={size} />
        </div>
        {label && (
          <div className={s.content}>
            <div className={s.label}>
              <Typography size={size === 'md' ? 'body-s' : 'caption-l'} weight={'medium'}>
                <p>{label}</p>
              </Typography>
            </div>
            {caption && (
              <div className={s.caption}>
                <Typography size={'caption-l'} weight={'regular'}>
                  <p>{caption}</p>
                </Typography>
              </div>
            )}
          </div>
        )}
      </label>
    </div>
  );
};
