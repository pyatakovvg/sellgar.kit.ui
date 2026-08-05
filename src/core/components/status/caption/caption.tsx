import React from 'react';

import { Typography } from '../../content/typography';

import cn from 'classnames';
import s from './default.module.scss';

export interface IProps {
  leadIcon?: React.ReactNode;
  caption: React.ReactNode;
  size?: 'l' | 'm';
  state?: 'default' | 'secondary' | 'info' | 'success' | 'destructive';
}

type TCaptionSize = NonNullable<IProps['size']>;

const typographySizeByCaptionSize: Record<TCaptionSize, 'caption-l' | 'caption-m'> = {
  l: 'caption-l',
  m: 'caption-m',
};

export const Caption: React.FC<IProps> = ({ leadIcon, caption, size = 'l', state = 'default' }) => {
  const typographySize = typographySizeByCaptionSize[size];
  const isPrimitiveText = typeof caption === 'string' || typeof caption === 'number';
  const className = React.useMemo(
    () =>
      cn(
        s.wrapper,
        {
          [s['size--l']]: size === 'l',
          [s['size--m']]: size === 'm',
        },
        {
          [s['state--default']]: state === 'default',
          [s['state--secondary']]: state === 'secondary',
          [s['state--info']]: state === 'info',
          [s['state--success']]: state === 'success',
          [s['state--destructive']]: state === 'destructive',
        },
      ),
    [size, state],
  );

  return (
    <div className={className} data-qa={'caption'}>
      {leadIcon && (
        <div className={s['lead-icon']} data-qa={'caption.lead-icon'}>
          {leadIcon}
        </div>
      )}
      <div className={s.caption}>
        {isPrimitiveText ? (
          <Typography size={typographySize} weight={'regular'}>
            <p data-qa={'caption.text'}>{caption}</p>
          </Typography>
        ) : (
          caption
        )}
      </div>
    </div>
  );
};
