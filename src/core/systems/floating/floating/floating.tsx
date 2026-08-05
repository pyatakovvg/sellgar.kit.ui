import {
  autoUpdate,
  flip,
  FloatingFocusManager,
  FloatingOverlay,
  FloatingPortal,
  offset,
  shift,
  size,
  useClick,
  useDismiss,
  useFloating,
  useInteractions,
  useRole,
  useTransitionStyles,
  type OpenChangeReason,
  type Placement,
  type ReferenceType,
  type Strategy,
} from '@floating-ui/react';
import React from 'react';

import {
  FloatingContext,
  type IFloatingContentOptions,
  type IFloatingContext,
  type IFloatingReferenceInteraction,
  useFloatingContext,
} from './context.ts';
import { List } from './list.tsx';
import { Select } from './select.tsx';
import { getCssSize, isRenderFunction, mergeEventHandlers, mergeRefs } from './utils.ts';

export type TFloatingPresentation = 'auto' | 'popover' | 'sheet';
export type TResolvedFloatingPresentation = 'popover' | 'sheet';
export type TFloatingRole = 'alertdialog' | 'dialog' | 'grid' | 'listbox' | 'menu' | 'tooltip' | 'tree';
export type TFloatingOpenChangeReason = OpenChangeReason | 'list-select' | 'programmatic' | 'trigger-key';

export interface TFloatingOpenChangeMeta {
  reason: TFloatingOpenChangeReason;
}

export interface TFloatingRootProps {
  children?: React.ReactNode;
  closeOnEscape?: boolean;
  closeOnOutsidePress?: boolean | ((event: MouseEvent) => boolean);
  defaultOpen?: boolean;
  disabled?: boolean;
  fallbackPlacements?: readonly Placement[];
  guards?: boolean;
  initialFocus?: number;
  lockScroll?: boolean;
  mobileQuery?: string;
  modal?: boolean;
  offset?: number;
  open?: boolean;
  outsidePressEvent?: 'click' | 'mousedown' | 'pointerdown';
  placement?: Placement;
  presentation?: TFloatingPresentation;
  returnFocus?: boolean;
  role?: TFloatingRole;
  shiftPadding?: number;
  strategy?: Strategy;
  visuallyHiddenDismiss?: boolean | string;
  withOverlay?: boolean;
  onOpenChange?(open: boolean, meta: TFloatingOpenChangeMeta): void;
}

export interface TFloatingTriggerState {
  getTriggerProps(): React.HTMLAttributes<HTMLElement>;
  isDisabled: boolean;
  isFocused: boolean;
  isKeyboardFocused: boolean;
  isOpen: boolean;
  presentation: TResolvedFloatingPresentation;
  ref: React.RefCallback<HTMLElement | null>;
}

export interface TFloatingContentState {
  floatingStyles: React.CSSProperties;
  getContentProps(): React.HTMLAttributes<HTMLElement>;
  isDisabled: boolean;
  isMounted: boolean;
  isOpen: boolean;
  placement: Placement;
  presentation: TResolvedFloatingPresentation;
  ref: React.RefCallback<HTMLElement | null>;
  transitionStyles: React.CSSProperties;
}

interface IFloatingTriggerProps {
  children: React.ReactElement | ((state: TFloatingTriggerState) => React.ReactNode);
}

interface IFloatingContentProps {
  children: React.ReactElement | ((state: TFloatingContentState) => React.ReactNode);
  matchReferenceWidth?: boolean;
  maxWidth?: number | string;
  minWidth?: number | string;
}

const DEFAULT_MOBILE_QUERY = '(max-width: 767px)';

const useResolvedPresentation = (
  presentation: TFloatingPresentation,
  mobileQuery: string,
): TResolvedFloatingPresentation => {
  const [isMobile, setMobile] = React.useState(false);

  React.useEffect(() => {
    if (presentation !== 'auto') {
      setMobile(presentation === 'sheet');
      return void 0;
    }

    const mediaQuery = window.matchMedia(mobileQuery);
    const handleChange = () => {
      setMobile(mediaQuery.matches);
    };

    handleChange();
    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [mobileQuery, presentation]);

  if (presentation === 'sheet') {
    return 'sheet';
  }

  if (presentation === 'popover') {
    return 'popover';
  }

  return isMobile ? 'sheet' : 'popover';
};

const FloatingRoot: React.FC<TFloatingRootProps> = ({
  children,
  closeOnEscape = true,
  closeOnOutsidePress = true,
  defaultOpen = false,
  disabled = false,
  fallbackPlacements,
  guards = true,
  initialFocus = -1,
  lockScroll = false,
  mobileQuery = DEFAULT_MOBILE_QUERY,
  modal = false,
  offset: offsetValue = 8,
  open: controlledOpen,
  outsidePressEvent = 'pointerdown',
  placement = 'bottom-start',
  presentation = 'auto',
  returnFocus = true,
  role: roleValue = 'dialog',
  shiftPadding = 10,
  strategy,
  visuallyHiddenDismiss,
  withOverlay = false,
  onOpenChange,
}) => {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen);
  const [isFocused, setFocused] = React.useState(false);
  const [isKeyboardFocused, setKeyboardFocused] = React.useState(false);
  const referenceInteractionsRef = React.useRef<readonly IFloatingReferenceInteraction[]>([]);

  const contentOptionsRef = React.useRef<IFloatingContentOptions>({
    matchReferenceWidth: false,
  });

  const resolvedPresentation = useResolvedPresentation(presentation, mobileQuery);
  const open = controlledOpen ?? uncontrolledOpen;

  const setOpen = React.useCallback(
    (nextOpen: boolean, reason: TFloatingOpenChangeReason) => {
      if (disabled) {
        return;
      }

      if (controlledOpen === void 0) {
        setUncontrolledOpen(nextOpen);
      }

      onOpenChange?.(nextOpen, { reason });
    },
    [controlledOpen, disabled, onOpenChange],
  );

  const floating = useFloating<ReferenceType>({
    middleware: [
      offset(offsetValue),
      flip({
        fallbackPlacements: fallbackPlacements ? [...fallbackPlacements] : void 0,
        padding: shiftPadding,
      }),
      shift({ padding: shiftPadding }),
      size({
        apply({ elements, rects }) {
          const options = contentOptionsRef.current;

          if (options.matchReferenceWidth) {
            elements.floating.style.width = `${Math.round(rects.reference.width)}px`;
          }

          if (options.minWidth !== void 0) {
            elements.floating.style.minWidth = getCssSize(options.minWidth);
          }

          if (options.maxWidth !== void 0) {
            elements.floating.style.maxWidth = getCssSize(options.maxWidth);
          }
        },
        padding: shiftPadding,
      }),
    ],
    onOpenChange(nextOpen, _event, reason) {
      setOpen(nextOpen, reason ?? 'programmatic');
    },
    open,
    placement,
    strategy: resolvedPresentation === 'sheet' ? 'fixed' : strategy,
    whileElementsMounted: autoUpdate,
  });

  const click = useClick(floating.context, {
    enabled: !disabled,
    event: 'click',
  });
  const dismiss = useDismiss(floating.context, {
    enabled: !disabled,
    escapeKey: closeOnEscape,
    outsidePress: closeOnOutsidePress,
    outsidePressEvent,
  });
  const role = useRole(floating.context, {
    role: roleValue,
  });
  const interactions = useInteractions([click, dismiss, role]);

  const setReferenceInteraction = React.useCallback((interaction: IFloatingReferenceInteraction): void => {
    const currentInteractions = referenceInteractionsRef.current;
    const nextInteractions: IFloatingReferenceInteraction[] = [];
    let hasUpdated = false;

    for (const currentInteraction of currentInteractions) {
      if (currentInteraction.id !== interaction.id) {
        nextInteractions.push(currentInteraction);
        continue;
      }

      if (currentInteraction.interaction === interaction.interaction) {
        return;
      }

      nextInteractions.push(interaction);
      hasUpdated = true;
    }

    if (!hasUpdated) {
      nextInteractions.push(interaction);
    }

    referenceInteractionsRef.current = nextInteractions;
  }, []);

  const removeReferenceInteraction = React.useCallback((id: string): void => {
    const currentInteractions = referenceInteractionsRef.current;
    const nextInteractions = currentInteractions.filter((interaction) => interaction.id !== id);

    if (nextInteractions.length === currentInteractions.length) {
      return;
    }

    referenceInteractionsRef.current = nextInteractions;
  }, []);

  const context = React.useMemo<IFloatingContext>(
    () => ({
      contentOptionsRef,
      disabled,
      floating,
      getFloatingProps: interactions.getFloatingProps,
      getReferenceProps: interactions.getReferenceProps,
      guards,
      initialFocus,
      isFocused,
      isKeyboardFocused,
      lockScroll,
      modal,
      open,
      presentation: resolvedPresentation,
      referenceInteractionsRef,
      removeReferenceInteraction,
      returnFocus,
      setFocused,
      setKeyboardFocused,
      setOpen,
      setReferenceInteraction,
      visuallyHiddenDismiss,
      withOverlay,
    }),
    [
      disabled,
      floating,
      guards,
      interactions.getFloatingProps,
      interactions.getReferenceProps,
      initialFocus,
      isFocused,
      isKeyboardFocused,
      lockScroll,
      modal,
      open,
      referenceInteractionsRef,
      removeReferenceInteraction,
      returnFocus,
      resolvedPresentation,
      setOpen,
      setReferenceInteraction,
      visuallyHiddenDismiss,
      withOverlay,
    ],
  );

  return <FloatingContext.Provider value={context}>{children}</FloatingContext.Provider>;
};

const Trigger: React.FC<IFloatingTriggerProps> = ({ children }) => {
  const floating = useFloatingContext();
  const isPointerFocusRef = React.useRef(false);

  const handleFocus = React.useCallback(
    (event: React.FocusEvent<HTMLElement>) => {
      floating.setFocused(true);
      floating.setKeyboardFocused(event.currentTarget.matches(':focus-visible') && !isPointerFocusRef.current);
      isPointerFocusRef.current = false;
    },
    [floating],
  );

  const handleBlur = React.useCallback(() => {
    floating.setFocused(false);
    floating.setKeyboardFocused(false);
  }, [floating]);

  const handlePointerDown = React.useCallback(() => {
    isPointerFocusRef.current = true;
  }, []);

  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLElement>) => {
      for (const interaction of floating.referenceInteractionsRef.current) {
        interaction.interaction.reference?.onKeyDown?.(event as React.KeyboardEvent<Element>);
      }

      if (floating.open || event.defaultPrevented) {
        return;
      }

      if (event.key !== 'Enter' && event.key !== ' ') {
        return;
      }

      event.preventDefault();
      floating.setOpen(!floating.open, 'trigger-key');
    },
    [floating],
  );

  const triggerProps = floating.getReferenceProps({
    onBlur: handleBlur,
    onFocus: handleFocus,
    onKeyDown: handleKeyDown,
    onPointerDown: handlePointerDown,
  });

  const state = React.useMemo<TFloatingTriggerState>(
    () => ({
      getTriggerProps: () => triggerProps as React.HTMLAttributes<HTMLElement>,
      isDisabled: floating.disabled,
      isFocused: floating.isFocused,
      isKeyboardFocused: floating.isKeyboardFocused,
      isOpen: floating.open,
      presentation: floating.presentation,
      ref: floating.floating.refs.setReference,
    }),
    [floating, triggerProps],
  );

  if (isRenderFunction<TFloatingTriggerState>(children)) {
    return <>{children(state)}</>;
  }

  const child = children;
  const childProps = child.props as React.HTMLAttributes<HTMLElement> & {
    ref?: React.Ref<ReferenceType | null>;
  };

  const childElement = child as React.ReactElement<
    React.HTMLAttributes<HTMLElement> & {
      ref?: React.Ref<ReferenceType | null>;
    }
  >;

  return React.cloneElement(childElement, {
    ...triggerProps,
    ...childProps,
    onBlur: mergeEventHandlers(triggerProps.onBlur, childProps.onBlur),
    onFocus: mergeEventHandlers(triggerProps.onFocus, childProps.onFocus),
    onKeyDown: mergeEventHandlers(triggerProps.onKeyDown, childProps.onKeyDown),
    onPointerDown: mergeEventHandlers(triggerProps.onPointerDown, childProps.onPointerDown),
    ref: mergeRefs(floating.floating.refs.setReference, childProps.ref),
  });
};

const Content: React.FC<IFloatingContentProps> = ({ children, matchReferenceWidth = false, maxWidth, minWidth }) => {
  const floating = useFloatingContext();
  const { isMounted, styles: transitionStyles } = useTransitionStyles(floating.floating.context);

  floating.contentOptionsRef.current = {
    matchReferenceWidth: floating.presentation === 'popover' && matchReferenceWidth,
    maxWidth,
    minWidth,
  };

  const update = floating.floating.update;

  React.useLayoutEffect(() => {
    if (!floating.open) {
      return;
    }

    void update();
  }, [floating.open, matchReferenceWidth, maxWidth, minWidth, update]);

  if (!floating.open && !isMounted) {
    return null;
  }

  const contentProps = floating.getFloatingProps();
  const state: TFloatingContentState = {
    floatingStyles: floating.floating.floatingStyles,
    getContentProps: () => contentProps,
    isDisabled: floating.disabled,
    isMounted,
    isOpen: floating.open,
    placement: floating.floating.placement,
    presentation: floating.presentation,
    ref: floating.floating.refs.setFloating,
    transitionStyles,
  };

  const content = isRenderFunction<TFloatingContentState>(children)
    ? children(state)
    : (() => {
        const childElement = children as React.ReactElement<
          React.HTMLAttributes<HTMLElement> & {
            ref?: React.Ref<HTMLElement | null>;
          }
        >;
        const childProps = childElement.props;

        return React.cloneElement(childElement, {
          ...contentProps,
          ...childProps,
          ref: mergeRefs(floating.floating.refs.setFloating, childProps.ref),
          style: {
            ...floating.floating.floatingStyles,
            ...transitionStyles,
            ...childProps.style,
          },
        });
      })();

  const managedContent = (
    <FloatingFocusManager
      context={floating.floating.context}
      guards={floating.guards}
      initialFocus={floating.initialFocus}
      modal={floating.modal}
      returnFocus={floating.returnFocus}
      visuallyHiddenDismiss={floating.visuallyHiddenDismiss}
    >
      <>{content}</>
    </FloatingFocusManager>
  );

  return (
    <FloatingPortal>
      {floating.withOverlay ? (
        <FloatingOverlay lockScroll={floating.lockScroll}>{managedContent}</FloatingOverlay>
      ) : (
        managedContent
      )}
    </FloatingPortal>
  );
};

type TFloating = typeof FloatingRoot & {
  Content: typeof Content;
  List: typeof List;
  Select: typeof Select;
  Trigger: typeof Trigger;
};

export const Floating: TFloating = Object.assign(FloatingRoot, {
  Content,
  List,
  Select,
  Trigger,
});
