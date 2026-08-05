import React from 'react';

import { Divider } from '../../../layout/divider';
import { Floating } from '../../../../systems/floating';

import { Empty } from '../empty';
import { Option } from '../option';

import cn from 'classnames';
import s from './option-list.module.scss';

import type { TFloatingListElementProps } from '../../../../systems/floating';

type TSelectAllItem = {
  kind: 'select-all';
};

type TOptionItem<T> = {
  item: T;
  kind: 'option';
};

type TListItem<T> = TOptionItem<T> | TSelectAllItem;

interface IRenderSurfaceOptions {
  children: React.ReactNode;
  listProps: TFloatingListElementProps;
  surfaceProps: TFloatingListElementProps;
}

interface IProps<T extends Record<string, any>, K extends keyof T> {
  disabled?: boolean;
  isAllSelected: boolean;
  optionKey: K;
  optionValue: K;
  options: readonly T[];
  selectAllEnabled: boolean;
  selectAllText: string;
  selectedValues: readonly T[K][];
  surfaceProps: TFloatingListElementProps;
  templateOption?(option: T): React.ReactNode;
  onSelect(optionValue: T[K]): void;
  onSelectAll(): void;
  renderSurface(options: IRenderSurfaceOptions): React.ReactElement;
}

const createListItems = <T,>(options: readonly T[], selectAllEnabled: boolean): readonly TListItem<T>[] => {
  const items: TListItem<T>[] = [];

  if (selectAllEnabled) {
    items.push({ kind: 'select-all' });
  }

  for (const option of options) {
    items.push({
      item: option,
      kind: 'option',
    });
  }

  return items;
};

const getSelectedListValues = <T extends Record<string, any>, K extends keyof T>(
  items: readonly TListItem<T>[],
  optionKey: K,
  selectedValues: readonly T[K][],
  isAllSelected: boolean,
): readonly number[] => {
  const values: number[] = [];

  for (let index = 0; index < items.length; index++) {
    const item = items[index];

    if (item === void 0) {
      continue;
    }

    if (item.kind === 'select-all') {
      if (isAllSelected) {
        values.push(index);
      }

      continue;
    }

    if (selectedValues.includes(item.item[optionKey])) {
      values.push(index);
    }
  }

  return values;
};

export const OptionList = <T extends Record<string, any>, K extends keyof T>({
  disabled,
  isAllSelected,
  optionKey,
  optionValue,
  options,
  selectAllEnabled,
  selectAllText,
  selectedValues,
  surfaceProps,
  templateOption,
  onSelect,
  onSelectAll,
  renderSurface,
}: IProps<T, K>): React.ReactElement => {
  const items = React.useMemo(() => createListItems(options, selectAllEnabled), [options, selectAllEnabled]);
  const selectedListValues = React.useMemo(
    () => getSelectedListValues(items, optionKey, selectedValues, isAllSelected),
    [isAllSelected, items, optionKey, selectedValues],
  );

  if (options.length === 0) {
    return renderSurface({
      children: <Empty title={'Нет данных'} />,
      listProps: {},
      surfaceProps,
    });
  }

  return (
    <Floating.List
      closeOnSelect={false}
      disabled={disabled}
      getItemDisabled={() => disabled === true}
      getItemValue={(_item, index) => index}
      items={items}
      selectionMode={'multiple'}
      value={selectedListValues}
      onItemSelect={({ item }) => {
        if (item.kind === 'select-all') {
          onSelectAll();
          return;
        }

        onSelect(item.item[optionKey]);
      }}
    >
      {(listState) => {
        const listProps = listState.getInnerProps();
        const listNode = (
          <div {...listProps} className={listProps.className}>
            {listState.items.map((itemState) => {
              const itemProps = itemState.getItemProps({
                className: s.option,
                style: itemState.style,
              });
              const isSelected =
                itemState.item.kind === 'select-all' ? selectedValues.length > 0 : itemState.isSelected;

              return (
                <React.Fragment key={String(itemState.index)}>
                  <div {...itemProps}>
                    <div
                      className={cn(s.container, {
                        [s.active]: itemState.isActive,
                        [s.selected]: itemState.isSelected,
                      })}
                    >
                      <div className={s.content}>
                        {itemState.item.kind === 'select-all' ? (
                          <Option
                            badge={options.length}
                            checked={selectedValues.length > 0}
                            disabled={disabled}
                            isIndeterminate={selectedValues.length > 0 && !isAllSelected}
                            title={selectAllText}
                          />
                        ) : templateOption ? (
                          templateOption(itemState.item.item)
                        ) : (
                          <Option
                            checked={isSelected}
                            disabled={disabled}
                            title={String(itemState.item.item[optionValue])}
                          />
                        )}
                      </div>
                    </div>
                  </div>

                  {itemState.item.kind === 'select-all' ? <Divider /> : null}
                </React.Fragment>
              );
            })}
          </div>
        );

        return renderSurface({
          children: listNode,
          listProps: listState.getListProps(),
          surfaceProps,
        });
      }}
    </Floating.List>
  );
};
