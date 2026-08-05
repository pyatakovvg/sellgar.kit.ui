import React from 'react';

import { Typography } from '../../content/typography';
import { Element } from './element';

import cn from 'classnames';
import s from './default.module.scss';

export interface IProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  size?: 'sm' | 'md';
  label?: string;
  caption?: string;
  isIndeterminate?: boolean;
}

export const Checkbox: React.FC<IProps> = ({ size = 'md', label, caption, ...props }) => {
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
    <label className={classNameInput}>
      <div className={s.element}>
        <Element size={size} {...props} />
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
  );
};
