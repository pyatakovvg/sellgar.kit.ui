import {
  autoUpdate,
  size,
  flip,
  shift,
  offset,
  useDismiss,
  useFloating,
  useInteractions,
  useListNavigation,
  useRole,
  FloatingFocusManager,
  FloatingPortal,
  useTransitionStyles,
  useId,
  useClick,
  type ReferenceType,
  UseFloatingOptions,
  FloatingOverlay,
} from '@floating-ui/react';
import React from 'react';

import { CloseFillIcon } from '../../../../../icons';

import { DropDownWrapper, Scrollbar } from '../../../..';

import cn from 'classnames';
import s from './default.module.scss';
import { useIsMobile } from './use-is-mobile-hook.ts';
import { Button, Typography } from '../../../../components';

interface IOptions {
  tabIndex?: number;
  initialOpen?: boolean;
  initialSelectedIndex?: number | null;
  selectedIndex?: number | null;
  open?: boolean;
  disabled?: boolean;
  setOpen?(open: boolean): void;
  onFocus?(): void;
  onBlur?(): void;
  onSelect?(selectedIndex: number | null): void;
}

const useSelect = (options: IOptions) => {
  const listRef = React.useRef<Array<HTMLElement | null>>([]);
  const [activeIndex, setActiveIndex] = React.useState<number | null>(null);
  const [selectedIndex, setSelectedIndex] = React.useState<number | null | undefined>(
    () => (options.selectedIndex || options.initialSelectedIndex) ?? null,
  );
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(options.initialOpen);

  const isMobile = useIsMobile();

  const open = options.open ?? uncontrolledOpen;
  const setOpen = options.setOpen ?? setUncontrolledOpen;

  const commonFloatingOptions: UseFloatingOptions<ReferenceType> = {
    placement: 'bottom-start',
    open,
    onOpenChange: (open: boolean) => {
      if (options.disabled) {
        return void 0;
      }
      setOpen(open);
    },
    whileElementsMounted: autoUpdate,
  };

  const floatingOptions: UseFloatingOptions<ReferenceType> = isMobile
    ? {
        ...commonFloatingOptions,
        strategy: 'fixed',
        middleware: [
          shift({ padding: 5 }),
          size({
            apply({ elements }) {
              elements.floating.className = `${s.mainWrapper} ${s.mobile}`;
              Object.assign(elements.floating.style, {
                width: '100%',
                top: 'auto',
                transform: 'none',
              });
            },
            padding: 10,
          }),
        ],
      }
    : {
        ...commonFloatingOptions,
        strategy: 'absolute',
        middleware: [
          shift({ padding: 5 }),
          offset({
            mainAxis: 8,
          }),
          flip({
            padding: 10,
            crossAxis: true,
            fallbackStrategy: 'bestFit',
            fallbackPlacements: ['bottom-start', 'top-start', 'bottom-end', 'top-end'],
          }),
          size({
            apply({ rects, elements }) {
              const referenceWidth = Math.max(Math.round(rects.reference.width), 240);

              elements.floating.className = `${s.mainWrapper} ${s.desktop}`;
              Object.assign(elements.floating.style, {
                width: `var(--numbers-${referenceWidth})`,
              });
            },
            padding: 10,
          }),
        ],
      };

  const floating = useFloating<ReferenceType>(floatingOptions);

  const floatingContext = floating.context;

  const click = useClick(floatingContext, { event: 'click', enabled: !options.disabled });
  const role = useRole(floatingContext, { role: 'listbox' });
  const dismiss = useDismiss(floatingContext);
  const listNav = useListNavigation(floatingContext, {
    listRef,
    activeIndex,
    selectedIndex,
    onNavigate: setActiveIndex,
    loop: true,
    nested: true,
    virtual: true,
    allowEscape: true,
  });
  const interactions = useInteractions([click, role, dismiss, listNav]);

  return React.useMemo(() => {
    return {
      open,
      setOpen,
      role,
      dismiss,
      listRef,
      activeIndex,
      setActiveIndex,
      selectedIndex,
      setSelectedIndex,
      floating,
      interactions,
      tabIndex: options.tabIndex,
      disabled: options.disabled,
      onSelect: options.onSelect,
      onBlur: options.onBlur,
      onFocus: options.onFocus,
    };
  }, [
    open,
    setOpen,
    role,
    dismiss,
    activeIndex,
    setActiveIndex,
    selectedIndex,
    setSelectedIndex,
    floating,
    interactions,
    options.tabIndex,
    options.disabled,
    options.onSelect,
    options.onBlur,
    options.onFocus,
  ]);
};

export type TSelectContext = ReturnType<typeof useSelect>;
const SelectContext = React.createContext({} as TSelectContext);

export const useSelectContext = () => {
  const context = React.useContext(SelectContext);

  if (context == null) {
    throw new Error('Select components must be wrapped in <Select />');
  }
  return context;
};

interface IProps {
  tabIndex?: number;
  initialOpen?: boolean;
  initialSelectedIndex?: number | null;
  open?: boolean;
  disabled?: boolean;
  selectedIndex?: number | null;
  setOpen?(open: boolean): void;
  onSelect?(selectedIndex: number | null): void;
  onFocus?(): void;
  onBlur?(): void;
}

const SelectWrapper: React.FC<React.PropsWithChildren<IProps>> = ({ children, ...options }) => {
  const select = useSelect(options);

  React.useEffect(() => {
    select.setSelectedIndex(options.selectedIndex);
  }, [options.selectedIndex]);

  return <SelectContext.Provider value={select}>{children}</SelectContext.Provider>;
};

interface IReferenceProps {
  reference(context: TSelectContext): React.ReactNode;
}

const Reference = React.memo((props: IReferenceProps) => {
  const select = useSelectContext();

  const referenceProps = select.interactions.getReferenceProps();

  return (
    <div
      className={s.wrapper}
      tabIndex={select.tabIndex}
      ref={select.floating.refs.setReference}
      {...referenceProps}
      onFocus={() => {
        select.onFocus && select.onFocus();
      }}
      onBlur={() => {
        select.onBlur && select.onBlur();
      }}
    >
      {props.reference(select)}
    </div>
  );
});

interface IOptionsProps {
  empty: React.ReactNode;
  header?: React.ReactNode;
  options(context: TSelectContext): React.ReactNode[];
}

const Options = React.memo((props: IOptionsProps) => {
  const select = useSelectContext();
  const { isMounted, styles: transitionStyles } = useTransitionStyles(select.floating.context);
  const isMobile = useIsMobile();

  const options = props.options(select);

  if (!select.open && !isMounted) {
    return null;
  }

  const handleClose = () => {
    select.setOpen(false);
  };

  if (isMobile) {
    return (
      <FloatingPortal>
        <FloatingOverlay lockScroll className={s.overlay}>
          <FloatingFocusManager context={select.floating.context}>
            <div
              {...select.interactions.getFloatingProps()}
              ref={select.floating.refs.setFloating}
              style={{
                ...transitionStyles,
                ...select.floating.floatingStyles,
                outline: 'none',
                zIndex: 999,
              }}
            >
              <div className={s.mobileOptionsWrapper} data-qa={'select.mobile-options'}>
                <header className={s.heading}>
                  <Typography size={'body-m'}>
                    <div className={s.header} data-qa={'select.mobile-header'}>
                      {props.header}
                    </div>
                  </Typography>
                  <div className={s.close} onClick={handleClose} data-qa={'select.mobile-close'}>
                    <CloseFillIcon />
                  </div>
                </header>
                <Scrollbar className={s.options}>{!!options.length ? options : props.empty}</Scrollbar>
                <div className={s.control}>
                  <Button style={'primary'} size={'md'} onClick={handleClose} data-qa={'select.mobile-apply'}>
                    Применить
                  </Button>
                </div>
              </div>
            </div>
          </FloatingFocusManager>
        </FloatingOverlay>
      </FloatingPortal>
    );
  }

  return (
    <FloatingPortal>
      <FloatingFocusManager context={select.floating.context}>
        <DropDownWrapper
          {...select.interactions.getFloatingProps()}
          ref={select.floating.refs.setFloating}
          style={{
            ...transitionStyles,
            ...select.floating.floatingStyles,
            outline: 'none',
            zIndex: 999,
          }}
        >
          <Scrollbar className={s.desktopOptions}>{!!options.length ? options : props.empty}</Scrollbar>
        </DropDownWrapper>
      </FloatingFocusManager>
    </FloatingPortal>
  );
});

interface IOptionProps {
  index: number;
  selected?: boolean;
  option(context: TSelectContext): React.ReactNode;
  onClick?(event: React.MouseEvent<HTMLElement>): void;
  onChange?(event: React.KeyboardEvent<HTMLElement>): void;
  disabled?: boolean;
}

const Option = React.memo((props: IOptionProps) => {
  const id = useId();
  const select = useSelectContext();

  const isHover = React.useMemo(() => select.activeIndex === props.index, [select.activeIndex]);
  const isSelected = React.useMemo(
    () => props.selected || select.selectedIndex === props.index,
    [select.selectedIndex, props.selected],
  );

  React.useEffect(() => {
    select.setSelectedIndex(select.selectedIndex);
  }, [select.selectedIndex]);

  const containerClassName = React.useMemo(
    () =>
      cn(s.container, {
        [s.hover]: isHover,
        [s.selected]: isSelected,
      }),
    [isHover, isSelected],
  );

  return (
    <div
      id={id}
      role={'option'}
      className={s.option}
      tabIndex={props.index === select.activeIndex ? select.activeIndex : -1}
      data-qa={'select.option'}
      {...select.interactions.getItemProps({
        ref(node) {
          select.listRef.current[props.index] = node;
        },
        onClick(event: React.MouseEvent<HTMLElement>) {
          if (props.disabled) return;

          select.setSelectedIndex(props.index);

          select.onSelect && select.onSelect(props.index);

          props.onClick && props.onClick(event);
        },
        onKeyDown(event) {
          if (props.disabled) return;

          if (event.key === 'Enter') {
            event.preventDefault();

            select.setSelectedIndex(select.activeIndex);
            select.onSelect && select.onSelect(select.activeIndex);

            props.onChange && props.onChange(event);
          }

          if (event.key === ' ') {
            event.preventDefault();

            select.setSelectedIndex(select.activeIndex);
            select.onSelect && select.onSelect(select.activeIndex);

            props.onChange && props.onChange(event);
          }
        },
      })}
    >
      <div className={containerClassName}>
        <div className={s.content}>{props.option(select)}</div>
      </div>
    </div>
  );
});

type TSelect = typeof SelectWrapper & {
  Reference: typeof Reference;
  Options: typeof Options;
  Option: typeof Option;
};

export const Select: TSelect = Object.assign(SelectWrapper, {
  Reference,
  Options,
  Option,
});
