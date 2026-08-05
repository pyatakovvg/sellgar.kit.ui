import React from 'react';

import { CloseLineIcon, ErrorWarningFillIcon } from '../../../../../icons';

import { Typography } from '../../../content/typography';

import cn from 'classnames';
import s from './default.module.scss';

interface IProps {
  status?: 'info' | 'warning' | 'destructive' | 'success';
  title?: React.ReactNode;
  description?: React.ReactNode;
  slot?: React.ReactNode;
  onClose?(): void;
}

export const Default: React.FC<IProps> = ({ status = 'info', ...props }) => {
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

  const handleClose = (event: React.MouseEvent<HTMLDivElement>) => {
    event.stopPropagation();

    const nativeEvent = event.nativeEvent as Event;
    nativeEvent.stopImmediatePropagation?.();

    props.onClose && props.onClose();
  };

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
          <div className={s.control} data-qa={'notification.slot'}>
            {React.Children.map(props.slot, (child) => {
              if (React.isValidElement(child)) {
                return React.cloneElement(child);
              }
              return child;
            })}
          </div>
        )}
      </div>
      {props.onClose && (
        <div className={s.close} onClick={handleClose} data-qa={'notification.close'}>
          <CloseLineIcon />
        </div>
      )}
    </div>
  );
};
