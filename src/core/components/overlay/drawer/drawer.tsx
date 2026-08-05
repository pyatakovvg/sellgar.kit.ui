import React from 'react';

import { OverlayDialog, useOverlayDialogContext } from '../../../systems/floating/internals/overlay-dialog';
import type { TOverlayCloseReason } from '../../../systems/floating/internals/overlay-dialog';

import s from './default.module.scss';

interface IProps {
  closeOnEscape?: boolean;
  closeOnOverlay?: boolean;
  open: boolean;
  onRequestClose?(reason: TOverlayCloseReason): boolean | Promise<boolean>;
  onClose(reason: TOverlayCloseReason): void;
}

export const useDrawerContext = useOverlayDialogContext;

export const DrawerComponent: React.FC<React.PropsWithChildren<IProps>> = ({
  closeOnOverlay,
  closeOnEscape,
  ...props
}) => {
  return (
    <OverlayDialog
      open={props.open}
      onRequestClose={props.onRequestClose}
      onClose={props.onClose}
      closeOnEscape={closeOnEscape}
      closeOnOverlay={closeOnOverlay}
    >
      <OverlayDialog.Content overlayClassName={s.overlay}>
        {(content) => (
          <div ref={content.ref} {...content.getFloatingProps({ className: s.wrapper })}>
            {props.children}
          </div>
        )}
      </OverlayDialog.Content>
    </OverlayDialog>
  );
};

type TDrawer = typeof DrawerComponent & {
  Close: typeof OverlayDialog.Close;
};

export const Drawer: TDrawer = Object.assign(DrawerComponent, {
  Close: OverlayDialog.Close,
});
