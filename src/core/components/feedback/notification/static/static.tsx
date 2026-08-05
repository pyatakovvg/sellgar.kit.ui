import React from 'react';

import { ErrorWarningFillIcon } from '../../../../../icons';

import { Typography } from '../../../content/typography';

import cn from 'classnames';
import s from './default.module.scss';

interface IProps {
  status?: 'info' | 'warning' | 'destructive' | 'success';
  title?: React.ReactNode;
  description?: React.ReactNode;
  slot?: React.ReactNode;
}

export const Static: React.FC<IProps> = ({ status = 'info', ...props }) => {
  const wrapperClassName = React.useMemo(
    () =>
      cn(s.wrapper, {
        [s['status--info']]: status === 'info',
        [s['status--warning']]: status === 'warning',
        [s['status--success']]: status === 'success',
        [s['status--destructive']]: status === 'destructive',
      }),
    [status],
  );

  return (
    <div className={wrapperClassName} data-qa={'notification'}>
      <div className={s.aside}>
        <div className={s.icon} data-qa={'notification.icon'}>
          <ErrorWarningFillIcon />
        </div>
      </div>
      <div className={s.content}>
        <div className={s.container}>
          {props.title && (
            <div className={s.title} data-qa={'notification.title'}>
              <Typography size={'body-s'} weight={'medium'}>
                <p className={s.text}>{props.title}</p>
              </Typography>
            </div>
          )}
          {props.description && (
            <div className={s.description} data-qa={'notification.description'}>
              <Typography size={'caption-l'} weight={'regular'}>
                <p className={s.text}>{props.description}</p>
              </Typography>
            </div>
          )}
        </div>
        {props.slot && (
          <div className={s.slot} data-qa={'notification.slot'}>
            {React.Children.map(props.slot, (child) => {
              if (React.isValidElement(child)) {
                return React.cloneElement(child);
              }
              return child;
            })}
          </div>
        )}
      </div>
    </div>
  );
};
