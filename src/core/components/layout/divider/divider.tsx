import React from 'react';

import { Button, Typography } from '../../..';

import s from './default.module.scss';

interface IEmptyProps {
  type?: undefined;
}

interface ILabelProps {
  type?: 'label-left' | 'label-center';
  label: string;
}

interface IActionProps {
  type?: 'action-center';
  actionLabel: string;
}

export type IProps = IEmptyProps | ILabelProps | IActionProps;

export const Divider: React.FC<IProps> = (props) => {
  switch (props.type) {
    case 'label-left':
      return (
        <div className={s.wrapper} data-qa={'divider'}>
          <div className={s.left}>
            <Typography size={'caption-m'} weight={'semi-bold'}>
              <span className={s.text} data-qa={'divider.text'}>
                {props.label}
              </span>
            </Typography>
          </div>
          <div className={s.line} />
        </div>
      );
    case 'label-center':
      return (
        <div className={s.wrapper} data-qa={'divider'}>
          <div className={s.line} />
          <div className={s.center}>
            <Typography size={'caption-m'} weight={'semi-bold'}>
              <span className={s.text} data-qa={'divider.text'}>
                {props.label}
              </span>
            </Typography>
          </div>
          <div className={s.line} />
        </div>
      );
    case 'action-center':
      return (
        <div className={s.wrapper} data-qa={'divider'}>
          <div className={s.line} />
          <div className={s.center}>
            <Button style={'secondary'} size={'xs'} data-qa={'divider.action'}>
              {props.actionLabel}
            </Button>
          </div>
          <div className={s.line} />
        </div>
      );
    default:
      return (
        <div className={s.wrapper} data-qa={'divider'}>
          <div className={s.line} />
        </div>
      );
  }
};
