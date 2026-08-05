import React from 'react';

import { Typography } from '../../content/typography';

import cn from 'classnames';
import s from './default.module.scss';

export type TLabelSize = 'l' | 'xl';
export type TLabelState = 'default' | 'secondary' | 'disabled';
export type TLabelTextAlign = 'left' | 'center';

type TLabelTypography = {
  size: 'caption-l' | 'body-s';
  weight: 'medium' | 'regular';
};

const typographyByLabelSize: Record<TLabelSize, TLabelTypography> = {
  l: {
    size: 'caption-l',
    weight: 'medium',
  },
  xl: {
    size: 'body-s',
    weight: 'regular',
  },
};

export interface IProps {
  label: React.ReactNode;
  caption?: React.ReactNode;
  required?: boolean;
  size?: TLabelSize;
  state?: TLabelState;
  tailIcon?: React.ReactNode;
  textAlign?: TLabelTextAlign;
}

const renderTextPart = (
  children: React.ReactNode,
  className: string,
  typography: TLabelTypography,
  dataQa?: string,
) => {
  const isPrimitiveText = typeof children === 'string' || typeof children === 'number';

  return (
    <div className={className}>
      {isPrimitiveText ? (
        <Typography size={typography.size} weight={typography.weight}>
          <p data-qa={dataQa}>{children}</p>
        </Typography>
      ) : (
        children
      )}
    </div>
  );
};

export const Label: React.FC<IProps> = ({
  label,
  caption,
  required,
  size = 'l',
  state = 'default',
  tailIcon,
  textAlign = 'left',
}) => {
  const typography = typographyByLabelSize[size];
  const className = React.useMemo(
    () =>
      cn(
        s.wrapper,
        {
          [s['state--secondary']]: state === 'secondary',
          [s['state--disabled']]: state === 'disabled',
        },
        {
          [s['text-align--center']]: textAlign === 'center',
        },
      ),
    [state, textAlign],
  );

  return (
    <div className={className} data-qa={'label'}>
      <div className={s.content}>
        {renderTextPart(label, s.label, typography)}
        {caption && renderTextPart(caption, s.caption, typography, 'label.caption')}
        {required && (
          <div className={s.required}>
            <Typography size={'caption-l'} weight={'regular'}>
              <p data-qa={'label.required'}>*</p>
            </Typography>
          </div>
        )}
      </div>
      {tailIcon && (
        <div className={s['tail-icon']} data-qa={'label.tailIcon'}>
          {tailIcon}
        </div>
      )}
    </div>
  );
};
