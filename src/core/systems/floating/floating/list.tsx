import { useInteractions, useListNavigation, useRole } from '@floating-ui/react';
import React from 'react';

import { useFloatingContext } from './context.ts';
import { isRenderFunction, mergeEventHandlers, mergeRefs } from './utils.ts';

import type { ElementProps } from '@floating-ui/react';

export type TFloatingListOrientation = 'horizontal' | 'vertical';
export type TFloatingListSelectionMode = 'multiple' | 'none' | 'single';
export type TFloatingListValue = number | string;
export type TFloatingListSelectionValue = TFloatingListValue | readonly TFloatingListValue[] | undefined;
export type TFloatingListRole = 'listbox' | 'menu';

export interface TFloatingListChangeMeta<TItem> {
  index: number;
  item: TItem;
  selected: boolean;
  value: TFloatingListValue;
}

export interface TFloatingListItemState<TItem> {
  getItemProps(props?: TFloatingListItemElementProps): TFloatingListItemElementProps;
  index: number;
  isActive: boolean;
  isDisabled: boolean;
  isSelected: boolean;
  item: TItem;
  style: React.CSSProperties | undefined;
  value: TFloatingListValue;
}

export interface TFloatingListState<TItem> {
  activeIndex: number | null;
  getInnerProps(props?: TFloatingListInnerElementProps): TFloatingListInnerElementProps;
  getListProps(props?: TFloatingListElementProps): TFloatingListElementProps;
  items: readonly TFloatingListItemState<TItem>[];
  itemsCount: number;
  role: TFloatingListRole;
  selectedValue: TFloatingListSelectionValue;
  selectedValues: readonly TFloatingListValue[];
}

export interface IFloatingListProps<TItem> {
  children: React.ReactNode | ((state: TFloatingListState<TItem>) => React.ReactNode);
  closeOnSelect?: boolean;
  defaultValue?: TFloatingListSelectionValue;
  disabled?: boolean;
  getItemDisabled?(item: TItem, index: number): boolean;
  getItemValue?(item: TItem, index: number): TFloatingListValue;
  items: readonly TItem[];
  loop?: boolean;
  orientation?: TFloatingListOrientation;
  role?: TFloatingListRole;
  selectionMode?: TFloatingListSelectionMode;
  value?: TFloatingListSelectionValue;
  onItemSelect?(meta: TFloatingListChangeMeta<TItem>): void;
  onValueChange?(value: TFloatingListSelectionValue, meta: TFloatingListChangeMeta<TItem>): void;
}

export type TFloatingListElementProps = React.HTMLAttributes<HTMLDivElement> & {
  ref?: React.Ref<HTMLDivElement | null>;
};

export type TFloatingListInnerElementProps = React.HTMLAttributes<HTMLDivElement> & {
  ref?: React.Ref<HTMLDivElement | null>;
};

export type TFloatingListItemElementProps = React.HTMLAttributes<HTMLDivElement> & {
  'data-index'?: number;
  ref?: React.Ref<HTMLDivElement | null>;
};

const EMPTY_SELECTED_VALUES: readonly TFloatingListValue[] = [];

const isSelectionValueArray = (value: TFloatingListSelectionValue): value is readonly TFloatingListValue[] => {
  return Array.isArray(value);
};

const normalizeSelectedValues = (
  selectionMode: TFloatingListSelectionMode,
  value: TFloatingListSelectionValue,
): readonly TFloatingListValue[] => {
  if (selectionMode === 'none' || value === void 0) {
    return EMPTY_SELECTED_VALUES;
  }

  if (isSelectionValueArray(value)) {
    return value;
  }

  return [value];
};

const hasSelectedValue = (selectedValues: readonly TFloatingListValue[], value: TFloatingListValue): boolean => {
  for (const selectedValue of selectedValues) {
    if (Object.is(selectedValue, value)) {
      return true;
    }
  }

  return false;
};

const resolveItemValue = <TItem,>(
  item: TItem,
  index: number,
  getItemValue: IFloatingListProps<TItem>['getItemValue'] | undefined,
): TFloatingListValue => {
  if (getItemValue !== void 0) {
    return getItemValue(item, index);
  }

  if (typeof item === 'number' || typeof item === 'string') {
    return item;
  }

  return index;
};

const getItemRole = (role: TFloatingListRole): string => {
  if (role === 'menu') {
    return 'menuitem';
  }

  return 'option';
};

const isMultipleSelectionValue = (
  selectionMode: TFloatingListSelectionMode,
  value: TFloatingListSelectionValue,
): value is readonly TFloatingListValue[] => {
  return selectionMode === 'multiple' && Array.isArray(value);
};

export const List = <TItem,>({
  children,
  closeOnSelect,
  defaultValue,
  disabled = false,
  getItemDisabled,
  getItemValue,
  items,
  loop = true,
  orientation = 'vertical',
  role: roleProp,
  selectionMode = 'single',
  value,
  onItemSelect,
  onValueChange,
}: IFloatingListProps<TItem>): React.ReactElement => {
  const floating = useFloatingContext();
  const itemRefs = React.useRef<Array<HTMLElement | null>>([]);
  const referenceInteractionId = React.useId();
  const optionIdPrefix = React.useId();
  const [activeIndex, setActiveIndex] = React.useState<number | null>(null);
  const [uncontrolledValue, setUncontrolledValue] = React.useState<TFloatingListSelectionValue>(defaultValue);

  const selectedValue = value ?? uncontrolledValue;
  const selectedValues = normalizeSelectedValues(selectionMode, selectedValue);
  const role = roleProp ?? (selectionMode === 'none' ? 'menu' : 'listbox');
  const shouldCloseOnSelect = closeOnSelect ?? selectionMode === 'single';

  const handleNavigate = React.useCallback((index: number | null): void => {
    setActiveIndex(index);
  }, []);

  const isItemDisabled = React.useCallback(
    (index: number): boolean => {
      const item = items[index];

      if (item === void 0) {
        return true;
      }

      return disabled || Boolean(getItemDisabled?.(item, index));
    },
    [disabled, getItemDisabled, items],
  );

  const selectedIndex = React.useMemo(() => {
    for (let index = 0; index < items.length; index++) {
      const item = items[index];

      if (item === void 0) {
        continue;
      }

      const itemValue = resolveItemValue(item, index, getItemValue);

      if (hasSelectedValue(selectedValues, itemValue)) {
        return index;
      }
    }

    return null;
  }, [getItemValue, items, selectedValues]);

  const disabledIndices = React.useMemo(() => {
    const indices: number[] = [];

    for (let index = 0; index < items.length; index++) {
      if (isItemDisabled(index)) {
        indices.push(index);
      }
    }

    return indices;
  }, [isItemDisabled, items]);

  const getOptionId = React.useCallback(
    (index: number): string => {
      return `${optionIdPrefix}-option-${index}`;
    },
    [optionIdPrefix],
  );

  const commitSelection = React.useCallback(
    (index: number) => {
      const item = items[index];

      if (item === void 0 || isItemDisabled(index)) {
        return;
      }

      const itemValue = resolveItemValue(item, index, getItemValue);
      const wasSelected = hasSelectedValue(selectedValues, itemValue);
      const isSelected = selectionMode === 'multiple' ? !wasSelected : true;
      let nextValue: TFloatingListSelectionValue = selectedValue;

      if (selectionMode === 'single') {
        nextValue = itemValue;
      }

      if (selectionMode === 'multiple') {
        const nextValues: TFloatingListValue[] = [];

        if (isMultipleSelectionValue(selectionMode, selectedValue)) {
          for (const selectedItemValue of selectedValue) {
            if (!Object.is(selectedItemValue, itemValue)) {
              nextValues.push(selectedItemValue);
            }
          }
        } else if (selectedValue !== void 0) {
          nextValues.push(selectedValue);
        }

        if (!wasSelected) {
          nextValues.push(itemValue);
        }

        nextValue = nextValues;
      }

      const meta: TFloatingListChangeMeta<TItem> = {
        index,
        item,
        selected: isSelected,
        value: itemValue,
      };

      if (value === void 0) {
        setUncontrolledValue(nextValue);
      }

      onItemSelect?.(meta);

      if (selectionMode !== 'none') {
        onValueChange?.(nextValue, meta);
      }

      if (shouldCloseOnSelect) {
        floating.setOpen(false, 'list-select');
      }
    },
    [
      floating,
      getItemValue,
      isItemDisabled,
      items,
      onItemSelect,
      onValueChange,
      selectedValue,
      selectedValues,
      selectionMode,
      shouldCloseOnSelect,
      value,
    ],
  );

  const handleReferenceKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLElement>) => {
      if (disabled || !floating.open || (event.key !== 'Enter' && event.key !== ' ')) {
        return;
      }

      if (activeIndex === null) {
        return;
      }

      event.preventDefault();
      commitSelection(activeIndex);
    },
    [activeIndex, commitSelection, disabled, floating.open],
  );

  const listNavigation = useListNavigation(floating.floating.context, {
    activeIndex,
    disabledIndices,
    focusItemOnOpen: true,
    listRef: itemRefs,
    loop,
    onNavigate: handleNavigate,
    orientation,
    selectedIndex,
    virtual: true,
  });
  const listRole = useRole(floating.floating.context, {
    role,
  });
  const interactions = useInteractions([listNavigation, listRole]);

  const referenceInteraction = React.useMemo<ElementProps>(
    () => ({
      reference: {
        ...listNavigation.reference,
        onKeyDown: mergeEventHandlers(listNavigation.reference?.onKeyDown, handleReferenceKeyDown),
      },
    }),
    [handleReferenceKeyDown, listNavigation.reference],
  );

  React.useEffect(() => {
    floating.setReferenceInteraction({
      id: referenceInteractionId,
      interaction: referenceInteraction,
    });

    return () => {
      floating.removeReferenceInteraction(referenceInteractionId);
    };
  }, [
    floating.removeReferenceInteraction,
    floating.setReferenceInteraction,
    referenceInteraction,
    referenceInteractionId,
  ]);

  const getListProps = React.useCallback(
    (props: TFloatingListElementProps = {}): TFloatingListElementProps => {
      const { ref, ...restProps } = props;
      const listProps = interactions.getFloatingProps({
        ...restProps,
        'aria-disabled': disabled || props['aria-disabled'],
        'aria-multiselectable': selectionMode === 'multiple' ? true : props['aria-multiselectable'],
        role: props.role ?? role,
      }) as TFloatingListElementProps;

      return {
        ...listProps,
        ref,
      };
    },
    [disabled, interactions, role, selectionMode],
  );

  const getInnerProps = React.useCallback(
    (
      props: TFloatingListInnerElementProps = {},
    ): TFloatingListInnerElementProps => {
      return props;
    },
    [],
  );

  const getItemProps = React.useCallback(
    (
      index: number,
      item: TItem,
      props: TFloatingListItemElementProps = {},
    ): TFloatingListItemElementProps => {
      const { ref, ...restProps } = props;
      const itemValue = resolveItemValue(item, index, getItemValue);
      const isSelected = hasSelectedValue(selectedValues, itemValue);
      const itemDisabled = isItemDisabled(index);

      const itemProps = interactions.getItemProps({
        ...restProps,
        'aria-disabled': itemDisabled || props['aria-disabled'],
        'aria-selected': role === 'listbox' ? isSelected : void 0,
        id: props.id ?? getOptionId(index),
        onClick: mergeEventHandlers(() => {
          if (!itemDisabled) {
            commitSelection(index);
          }
        }, props.onClick),
        onFocus: mergeEventHandlers(() => {
          if (!itemDisabled) {
            setActiveIndex(index);
          }
        }, props.onFocus),
        onMouseEnter: mergeEventHandlers(() => {
          if (!itemDisabled && floating.presentation === 'popover') {
            setActiveIndex(index);
          }
        }, props.onMouseEnter),
        role: props.role ?? getItemRole(role),
        tabIndex: props.tabIndex ?? -1,
      }) as TFloatingListItemElementProps;

      return {
        ...itemProps,
        'data-index': props['data-index'],
        ref: mergeRefs((node) => {
          itemRefs.current[index] = node instanceof HTMLElement ? node : null;
        }, ref),
      };
    },
    [
      commitSelection,
      floating.presentation,
      getOptionId,
      getItemValue,
      interactions,
      isItemDisabled,
      role,
      selectedValues,
    ],
  );

  const listItems = React.useMemo(() => {
    const itemStates: TFloatingListItemState<TItem>[] = [];

    for (let index = 0; index < items.length; index++) {
      const item = items[index];

      if (item === void 0) {
        continue;
      }

      const itemValue = resolveItemValue(item, index, getItemValue);
      const itemDisabled = isItemDisabled(index);

      itemStates.push({
        getItemProps: (props) => getItemProps(index, item, props),
        index,
        isActive: activeIndex === index,
        isDisabled: itemDisabled,
        isSelected: hasSelectedValue(selectedValues, itemValue),
        item,
        style: void 0,
        value: itemValue,
      });
    }

    return itemStates;
  }, [
    activeIndex,
    getItemProps,
    getItemValue,
    isItemDisabled,
    items,
    selectedValues,
  ]);

  React.useEffect(() => {
    const reference = floating.floating.refs.domReference.current;

    if (!(reference instanceof HTMLElement)) {
      return void 0;
    }

    if (!floating.open || activeIndex === null) {
      reference.removeAttribute('aria-activedescendant');
      return void 0;
    }

    reference.setAttribute('aria-activedescendant', getOptionId(activeIndex));

    return () => {
      reference.removeAttribute('aria-activedescendant');
    };
  }, [activeIndex, floating.floating.refs.domReference, floating.open, getOptionId]);

  const state = React.useMemo<TFloatingListState<TItem>>(
    () => ({
      activeIndex,
      getInnerProps,
      getListProps,
      items: listItems,
      itemsCount: items.length,
      role,
      selectedValue,
      selectedValues,
    }),
    [
      activeIndex,
      getInnerProps,
      getListProps,
      items.length,
      listItems,
      role,
      selectedValue,
      selectedValues,
    ],
  );

  if (isRenderFunction<TFloatingListState<TItem>>(children)) {
    return <>{children(state)}</>;
  }

  return <>{children}</>;
};
