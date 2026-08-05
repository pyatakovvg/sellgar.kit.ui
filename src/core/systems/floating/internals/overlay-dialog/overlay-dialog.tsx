import React from 'react';
import { FloatingFocusManager, FloatingOverlay, FloatingPortal, useMergeRefs } from '@floating-ui/react';
import cn from 'classnames';

import { CloseFillIcon } from '../../../../../icons';
import { useOverlayDialog } from './use-overlay-dialog.ts';
import type { TOverlayDialogOptions } from './use-overlay-dialog.ts';

import s from './default.module.scss';

type TOverlayDialogData = ReturnType<typeof useOverlayDialog>;
type TOverlayDialogContext = TOverlayDialogData | null;

const OverlayDialogContext = React.createContext<TOverlayDialogContext>(null);

export const useOverlayDialogContext = () => {
  const context = React.useContext(OverlayDialogContext);

  if (context == null) {
    throw new Error('OverlayDialog components must be wrapped in <OverlayDialog />');
  }

  return context;
};

const OverlayDialogRoot: React.FC<React.PropsWithChildren<TOverlayDialogOptions>> = ({ children, ...options }) => {
  const dialog = useOverlayDialog(options);

  return <OverlayDialogContext.Provider value={dialog}>{children}</OverlayDialogContext.Provider>;
};

interface IOverlayDialogContentProps {
  overlayClassName?: string;
  children(content: {
    ref: React.RefCallback<HTMLElement | null>;
    getFloatingProps: TOverlayDialogData['getFloatingProps'];
  }): React.ReactElement;
}

const Content: React.FC<IOverlayDialogContentProps> = ({ children, overlayClassName }) => {
  const { context: floatingContext, ...context } = useOverlayDialogContext();
  const ref = useMergeRefs([context.refs.setFloating]) as React.RefCallback<HTMLElement | null>;

  if (!floatingContext.open) return null;

  return (
    <FloatingPortal>
      <FloatingOverlay className={overlayClassName} lockScroll>
        <FloatingFocusManager context={floatingContext} initialFocus={-1}>
          {children({
            ref,
            getFloatingProps: context.getFloatingProps,
          })}
        </FloatingFocusManager>
      </FloatingOverlay>
    </FloatingPortal>
  );
};

const Close = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  function OverlayDialogClose({ children, className, ...props }, ref) {
    const { requestClose, isClosePending } = useOverlayDialogContext();

    const handleClose = () => {
      void requestClose('close-button');
    };

    if (children) {
      return React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          const childElement = child as React.ReactElement<React.ComponentProps<any>>;

          return React.cloneElement(childElement, {
            onClick: handleClose,
          });
        }

        return child;
      });
    }

    return (
      <button
        aria-label={'Close'}
        {...props}
        ref={ref}
        type={'button'}
        className={cn(s.close, className)}
        disabled={props.disabled ?? isClosePending}
        onClick={handleClose}
      >
        <CloseFillIcon />
      </button>
    );
  },
);

type TOverlayDialog = typeof OverlayDialogRoot & {
  Content: typeof Content;
  Close: typeof Close;
};

export const OverlayDialog: TOverlayDialog = Object.assign(OverlayDialogRoot, {
  Content,
  Close,
});
