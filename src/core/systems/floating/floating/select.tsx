import React from 'react';

import {
  List,
  type TFloatingListChangeMeta,
  type TFloatingListElementProps,
  type TFloatingListInnerElementProps,
  type TFloatingListItemState,
  type TFloatingListOrientation,
  type TFloatingListValue,
} from './list.tsx';

export type TFloatingSelectValue = TFloatingListValue;

export interface TFloatingSelectChangeMeta<TItem> {
  index: number;
  item: TItem;
  value: TFloatingSelectValue;
}

export interface TFloatingSelectState<TItem> {
  activeIndex: number | null;
  getInnerProps(props?: TFloatingListInnerElementProps): TFloatingListInnerElementProps;
  getListProps(props?: TFloatingListElementProps): TFloatingListElementProps;
  items: readonly TFloatingListItemState<TItem>[];
  itemsCount: number;
  selectedItem: TItem | undefined;
  selectedValue: TFloatingSelectValue | undefined;
}

export interface IFloatingSelectProps<TItem> {
  children: (state: TFloatingSelectState<TItem>) => React.ReactNode;
  closeOnSelect?: boolean;
  defaultValue?: TFloatingSelectValue;
  disabled?: boolean;
  getItemDisabled?(item: TItem, index: number): boolean;
  getItemValue?(item: TItem, index: number): TFloatingSelectValue;
  items: readonly TItem[];
  loop?: boolean;
  orientation?: TFloatingListOrientation;
  value?: TFloatingSelectValue;
  onChange?(
    value: TFloatingSelectValue,
    meta: TFloatingSelectChangeMeta<TItem>,
  ): void;
}

const resolveSelectItemValue = <TItem,>(
  item: TItem,
  index: number,
  getItemValue: IFloatingSelectProps<TItem>['getItemValue'] | undefined,
): TFloatingSelectValue => {
  if (getItemValue !== void 0) {
    return getItemValue(item, index);
  }

  if (typeof item === 'number' || typeof item === 'string') {
    return item;
  }

  return index;
};

const getSelectedItem = <TItem,>(
  items: readonly TItem[],
  selectedValue: TFloatingSelectValue | undefined,
  getItemValue: IFloatingSelectProps<TItem>['getItemValue'] | undefined,
): TItem | undefined => {
  if (selectedValue === void 0) {
    return void 0;
  }

  for (let index = 0; index < items.length; index++) {
    const item = items[index];

    if (item === void 0) {
      continue;
    }

    const itemValue = resolveSelectItemValue(item, index, getItemValue);

    if (Object.is(itemValue, selectedValue)) {
      return item;
    }
  }

  return void 0;
};

const createChangeMeta = <TItem,>(
  meta: TFloatingListChangeMeta<TItem>,
): TFloatingSelectChangeMeta<TItem> => ({
  index: meta.index,
  item: meta.item,
  value: meta.value,
});

export const Select = <TItem,>({
  children,
  closeOnSelect = true,
  defaultValue,
  disabled,
  getItemDisabled,
  getItemValue,
  items,
  loop,
  orientation,
  value,
  onChange,
}: IFloatingSelectProps<TItem>): React.ReactElement => {
  return (
    <List
      closeOnSelect={closeOnSelect}
      defaultValue={defaultValue}
      disabled={disabled}
      getItemDisabled={getItemDisabled}
      getItemValue={getItemValue}
      items={items}
      loop={loop}
      orientation={orientation}
      role={'listbox'}
      selectionMode={'single'}
      value={value}
      onValueChange={(nextValue, meta) => {
        if (typeof nextValue === 'number' || typeof nextValue === 'string') {
          onChange?.(nextValue, createChangeMeta(meta));
        }
      }}
    >
      {(state) => {
        const selectedValue =
          typeof state.selectedValue === 'number' ||
          typeof state.selectedValue === 'string'
            ? state.selectedValue
            : void 0;

        return children({
          activeIndex: state.activeIndex,
          getInnerProps: state.getInnerProps,
          getListProps: state.getListProps,
          items: state.items,
          itemsCount: state.itemsCount,
          selectedItem: getSelectedItem(items, selectedValue, getItemValue),
          selectedValue,
        });
      }}
    </List>
  );
};
