import { FloatingOverlay } from '@floating-ui/react';
import React from 'react';

import { CloseFillIcon } from '../../../../../../icons';

import { Button } from '../../../../action/button';
import { DropDownWrapper } from '../../../../../systems/floating';

import { ListScroll } from '../list-scroll';

import cn from 'classnames';
import s from './sheet-surface.module.scss';

import type { TFloatingListElementProps } from '../../../../../systems/floating';

interface IProps {
  actionLabel?: React.ReactNode;
  children: React.ReactNode;
  listProps: TFloatingListElementProps;
  placeholder: React.ReactNode;
  props: TFloatingListElementProps;
  onClose(): void;
}

export const SheetSurface: React.FC<IProps> = ({
  actionLabel = 'Применить',
  children,
  listProps,
  placeholder,
  props,
  onClose,
}) => {
  const surfaceProps: TFloatingListElementProps = {
    ...props,
    className: cn(s.wrapper, props.className),
    style: {
      ...props.style,
      bottom: 0,
      left: 0,
      right: 0,
      top: 'auto',
      transform: 'none',
      width: '100%',
    },
  };

  return (
    <FloatingOverlay className={s.overlay} lockScroll>
      <DropDownWrapper {...surfaceProps}>
        <div className={s.sheet}>
          <header className={s.heading}>
            <div className={s.header}>{placeholder}</div>
            <button className={s.close} type={'button'} onClick={onClose}>
              <CloseFillIcon />
            </button>
          </header>
          <ListScroll className={s.content} props={listProps}>
            {children}
          </ListScroll>
          <div className={s.control}>
            <Button style={'primary'} size={'sm'} type={'button'} onClick={onClose}>
              {actionLabel}
            </Button>
          </div>
        </div>
      </DropDownWrapper>
    </FloatingOverlay>
  );
};
