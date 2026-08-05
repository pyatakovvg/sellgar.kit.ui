import { InformationFillIcon } from '../../../../icons';
import * as React from 'react';
import {
  useFloating,
  autoUpdate,
  offset,
  flip,
  shift,
  arrow,
  useHover,
  useFocus,
  useDismiss,
  useRole,
  useInteractions,
  useMergeRefs,
  FloatingPortal,
  useTransitionStyles,
  FloatingArrow,
} from '@floating-ui/react';
import type { Placement } from '@floating-ui/react';

import { Balloon } from './balloon';
import { Typography } from '../../content/typography';

import cn from 'classnames';
import s from './default.module.scss';

export interface IProps {
  initialOpen?: boolean;
  placement?: Placement;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  size?: 'sm' | 'md';
}

export function useTooltip({
  size = 'sm',
  initialOpen = false,
  placement = 'top',
  open: controlledOpen,
  onOpenChange: setControlledOpen,
}: IProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(initialOpen);

  const arrowRef = React.useRef(null);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = setControlledOpen ?? setUncontrolledOpen;

  const data = useFloating({
    placement,
    open,
    onOpenChange: setOpen,
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(6),
      flip({
        crossAxis: placement.includes('-'),
        fallbackAxisSideDirection: 'start',
        padding: 5,
      }),
      shift({ padding: 10 }),
      arrow({ element: arrowRef }),
    ],
  });

  const context = data.context;

  const hover = useHover(context, {
    move: false,
    enabled: controlledOpen == null,
  });
  const focus = useFocus(context, {
    enabled: controlledOpen == null,
  });
  const dismiss = useDismiss(context);
  const role = useRole(context, { role: 'tooltip' });

  const interactions = useInteractions([hover, focus, dismiss, role]);

  return React.useMemo(
    () => ({
      size,
      open,
      setOpen,
      arrowRef,
      ...interactions,
      ...data,
    }),
    [open, setOpen, interactions, data, size, arrowRef],
  );
}

type ContextType = ReturnType<typeof useTooltip> | null;
const TooltipContext = React.createContext<ContextType>(null);

export const useTooltipContext = () => {
  const context = React.useContext(TooltipContext);

  if (context == null) {
    throw new Error('Tooltip components must be wrapped in <Tooltip />');
  }
  return context;
};

const TooltipWrapper: React.FC<React.PropsWithChildren<IProps>> = ({ children, ...options }) => {
  const tooltip = useTooltip(options);

  return <TooltipContext.Provider value={tooltip}>{children}</TooltipContext.Provider>;
};

const Trigger = React.forwardRef<HTMLElement, React.HTMLProps<HTMLElement>>(function TooltipTrigger(
  { children, ...props },
  propRef,
) {
  const context = useTooltipContext();
  const ref = useMergeRefs([context.refs.setReference, propRef]);

  return (
    <div
      className={s.wrapper}
      ref={ref}
      data-state={context.open ? 'open' : 'closed'}
      {...context.getReferenceProps(props)}
    >
      {React.isValidElement(children) ? (
        React.cloneElement(children as React.DetailedReactHTMLElement<React.HTMLAttributes<HTMLElement>, HTMLElement>, {
          className: cn({
            [s.active]: context.open,
          }),
        })
      ) : (
        <div
          className={cn(s.icon, {
            [s.active]: context.open,
          })}
        >
          <InformationFillIcon />
        </div>
      )}
    </div>
  );
});

export const Content = React.forwardRef<HTMLDivElement, React.HTMLProps<HTMLDivElement>>(function TooltipContent(
  { style, ...props },
  propRef,
) {
  const context = useTooltipContext();
  const ref = useMergeRefs([context.refs.setFloating, propRef]);
  const { isMounted, styles } = useTransitionStyles(context.context);

  if (!context.open && !isMounted) return null;

  return (
    <FloatingPortal>
      <div
        ref={ref}
        style={{
          ...context.floatingStyles,
          ...style,
          ...styles,
        }}
        {...context.getFloatingProps(props)}
      >
        <Balloon size={context.size}>{props.children}</Balloon>
        <FloatingArrow ref={context.arrowRef} context={context.context} className={s.arrow} width={14} height={4} />
        <FloatingArrow
          ref={context.arrowRef}
          context={context.context}
          className={s.arrow2}
          width={14}
          height={4}
          style={{ transform: 'translateY(-1px)' }}
        />
      </div>
    </FloatingPortal>
  );
});

const Label: React.FC<React.PropsWithChildren> = (props) => {
  return (
    <div className={s.label}>
      <Typography size={'caption-m'} weight={'semi-bold'}>
        <p>{props.children}</p>
      </Typography>
    </div>
  );
};

const Caption: React.FC<React.PropsWithChildren> = (props) => {
  return (
    <div className={s.caption}>
      <Typography size={'caption-m'} weight={'medium'}>
        <p>{props.children}</p>
      </Typography>
    </div>
  );
};

type TToolTipContent = typeof Content & {
  Label: typeof Label;
  Caption: typeof Caption;
};

type TToolTipWrapper = typeof TooltipWrapper & {
  Trigger: typeof Trigger;
  Content: TToolTipContent;
};

export const ToolTip: TToolTipWrapper = Object.assign(TooltipWrapper, {
  Trigger,
  Content: Object.assign(Content, {
    Label,
    Caption,
  }),
});
