import {
  autoUpdate,
  flip,
  offset,
  shift,
  size,
  useClick,
  useDismiss,
  useFloating,
  useInteractions,
  useRole,
  FloatingFocusManager,
  FloatingPortal,
  useTransitionStyles,
  type Placement,
  type ReferenceType,
} from '@floating-ui/react';
import React from 'react';

import { More2FillIcon } from '../../../../icons';
import { DropDownWrapper } from '../../..';

import cn from 'classnames';
import s from './default.module.scss';

interface IProps {
  initialOpen?: boolean;
  open?: boolean;
  onOpenChange?(open: boolean): void;
  placement?: Placement;
  disabled?: boolean;
  role?: 'dialog' | 'listbox';
  sizeToReference?: boolean;
}

const usePopover = ({
  placement = 'bottom-end',
  role: ariaRole = 'dialog',
  sizeToReference = false,
  ...options
}: IProps) => {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(options.initialOpen);

  const open = options.open ?? uncontrolledOpen;
  const setOpen = options.onOpenChange ?? setUncontrolledOpen;

  const middleware = [offset(8), flip({ padding: 10 }), shift({ padding: 10 })];

  if (sizeToReference) {
    middleware.push(
      size({
        apply({ rects, elements }) {
          Object.assign(elements.floating.style, {
            width: `${rects.reference.width}px`,
            minWidth: 'var(--numbers-320)',
            maxWidth: 'var(--numbers-400)',
          });
        },
        padding: 10,
      }),
    );
  }

  const floating = useFloating<ReferenceType>({
    open,
    placement,
    onOpenChange: (open: boolean) => {
      if (options.disabled) {
        return void 0;
      }
      setOpen(open);
    },
    whileElementsMounted: autoUpdate,
    middleware,
  });

  const floatingContext = floating.context;

  const click = useClick(floatingContext);
  const role = useRole(floatingContext, { role: ariaRole });
  const dismiss = useDismiss(floatingContext);
  const interactions = useInteractions([click, role, dismiss]);

  return React.useMemo(() => {
    return {
      open,
      setOpen,
      floating,
      interactions,
      disabled: options.disabled,
    };
  }, [open, setOpen, floating, interactions, options.disabled]);
};

type TPopoverContext = ReturnType<typeof usePopover>;
const PopoverContext = React.createContext({} as TPopoverContext);

export const usePopoverContext = () => {
  const context = React.useContext(PopoverContext);

  if (context == null) {
    throw new Error('Popover components must be wrapped in <Popover />');
  }
  return context;
};

const PopoverWrapper: React.FC<React.PropsWithChildren<IProps>> = ({ children, ...options }) => {
  const popover = usePopover(options);

  return <PopoverContext.Provider value={popover}>{children}</PopoverContext.Provider>;
};

interface ITriggerProps {
  icon?: React.ReactNode;
  ariaLabel?: string;
  tabIndex?: number;
  onFocus?(event: React.FocusEvent<HTMLDivElement>): void;
  onBlur?(event: React.FocusEvent<HTMLDivElement>): void;
  onKeyDown?(event: React.KeyboardEvent<HTMLDivElement>): void;
  children?: React.ReactNode;
}

const Trigger: React.FC<ITriggerProps> = ({
  icon = <More2FillIcon />,
  ariaLabel,
  tabIndex,
  onFocus,
  onBlur,
  onKeyDown,
  children,
}) => {
  const popover = usePopoverContext();

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event);

    if (event.defaultPrevented || popover.disabled) {
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      popover.setOpen(!popover.open);
    }
  };

  return (
    <div
      className={s.wrapper}
      {...popover.interactions.getReferenceProps({ onFocus, onBlur, onKeyDown: handleKeyDown })}
      aria-label={ariaLabel}
      tabIndex={tabIndex}
      ref={popover.floating.refs.setReference}
    >
      {children ? (
        children
      ) : (
        <div
          className={cn(s.icon, {
            [s.active]: popover.open,
          })}
        >
          {icon}
        </div>
      )}
    </div>
  );
};

const Content: React.FC<React.PropsWithChildren> = (props) => {
  const popover = usePopoverContext();
  const { isMounted, styles: transitionStyles } = useTransitionStyles(popover.floating.context);

  if (!popover.open && !isMounted) {
    return null;
  }

  return (
    <FloatingPortal>
      <FloatingFocusManager context={popover.floating.context} initialFocus={-1} visuallyHiddenDismiss modal={false}>
        <DropDownWrapper
          {...popover.interactions.getFloatingProps()}
          ref={popover.floating.refs.setFloating}
          style={{
            ...transitionStyles,
            ...popover.floating.floatingStyles,
          }}
        >
          {props.children}
        </DropDownWrapper>
      </FloatingFocusManager>
    </FloatingPortal>
  );
};

type TPopover = typeof PopoverWrapper & {
  Trigger: typeof Trigger;
  Content: typeof Content;
};

export const Popover: TPopover = Object.assign(PopoverWrapper, {
  Trigger,
  Content,
});
