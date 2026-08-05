import React from 'react';
import { useDismiss, useFloating, useInteractions, useRole, type OpenChangeReason } from '@floating-ui/react';

export type TOverlayCloseReason = 'close-button' | 'overlay' | 'escape' | 'programmatic';

interface IOverlayDialogOptions {
  closeOnEscape?: boolean;
  closeOnOverlay?: boolean;
  open: boolean;
  outsidePressEvent?: 'pointerdown' | 'mousedown' | 'click';
  onRequestClose?(reason: TOverlayCloseReason): boolean | Promise<boolean>;
  onClose(reason: TOverlayCloseReason): void;
}

export type TOverlayDialogOptions = IOverlayDialogOptions;

const getCloseReason = (reason?: OpenChangeReason): TOverlayCloseReason => {
  if (reason === 'outside-press') {
    return 'overlay';
  }

  if (reason === 'escape-key') {
    return 'escape';
  }

  return 'programmatic';
};

export const useOverlayDialog = ({
  closeOnEscape = true,
  closeOnOverlay = true,
  open,
  outsidePressEvent = 'click',
  onRequestClose,
  onClose,
}: IOverlayDialogOptions) => {
  const isClosePendingRef = React.useRef(false);
  const [isClosePending, setIsClosePending] = React.useState(false);

  const requestClose = React.useCallback(
    async (reason: TOverlayCloseReason = 'programmatic') => {
      if (isClosePendingRef.current) {
        return;
      }

      isClosePendingRef.current = true;
      setIsClosePending(true);

      try {
        const isCloseAllowed = (await onRequestClose?.(reason)) ?? true;

        if (isCloseAllowed) {
          onClose(reason);
        }
      } finally {
        isClosePendingRef.current = false;
        setIsClosePending(false);
      }
    },
    [onRequestClose, onClose],
  );

  const data = useFloating({
    open,
    onOpenChange: (nextOpen, _event, reason) => {
      if (!nextOpen) {
        void requestClose(getCloseReason(reason));
      }
    },
  });

  const context = data.context;

  const dismiss = useDismiss(context, {
    outsidePressEvent,
    escapeKey: closeOnEscape,
    outsidePress: (event) => {
      if (!closeOnOverlay) {
        return false;
      }

      return !(event.target instanceof Element && event.target.closest('[data-floating-ui-ignore-outside-press]'));
    },
  });
  const role = useRole(context);

  const interactions = useInteractions([dismiss, role]);

  return React.useMemo(
    () => ({
      open,
      onClose,
      requestClose,
      isClosePending,
      ...interactions,
      ...data,
    }),
    [open, onClose, requestClose, isClosePending, interactions, data],
  );
};
