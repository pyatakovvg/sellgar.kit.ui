import React from 'react';
import cn from 'classnames';

import { OverlayDialog, useOverlayDialogContext } from '../../../systems/floating/internals/overlay-dialog';
import type { TOverlayCloseReason } from '../../../systems/floating/internals/overlay-dialog';

import s from './modal.module.scss';

interface IProps {
  closeOnEscape?: boolean;
  closeOnOverlay?: boolean;
  open: boolean;
  onRequestClose?(reason: TOverlayCloseReason): boolean | Promise<boolean>;
  onClose(reason: TOverlayCloseReason): void;
}

export const useModalContext = useOverlayDialogContext;

export const Close = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  function DialogClose({ className, ...props }, ref) {
    return <OverlayDialog.Close {...props} ref={ref} className={cn(s.close, className)} data-qa={'modal.close'} />;
  },
);

export const ModalComponent: React.FC<React.PropsWithChildren<IProps>> = (props) => {
  return (
    <OverlayDialog
      closeOnEscape={props.closeOnEscape}
      closeOnOverlay={props.closeOnOverlay}
      open={props.open}
      outsidePressEvent={'mousedown'}
      onRequestClose={props.onRequestClose}
      onClose={props.onClose}
    >
      <OverlayDialog.Content overlayClassName={s.overlay}>
        {(content) => (
          <div ref={content.ref} {...content.getFloatingProps({ className: s.wrapper })} data-qa={'modal'}>
            {props.children}
          </div>
        )}
      </OverlayDialog.Content>
    </OverlayDialog>
  );
};

type TModal = typeof ModalComponent & {
  Close: typeof Close;
};

export const Modal: TModal = Object.assign(ModalComponent, {
  Close,
});
