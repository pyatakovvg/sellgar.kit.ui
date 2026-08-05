import React from 'react';

import { Empty } from '../empty';
import { Option } from '../option';
import { Floating } from '../../../../systems/floating';

import cn from 'classnames';
import s from './option-list.module.scss';

import type { TFloatingListElementProps } from '../../../../systems/floating';

interface IRenderSurfaceOptions {
  children: React.ReactNode;
  listProps: TFloatingListElementProps;
  surfaceProps: TFloatingListElementProps;
}

interface IProps<T extends Record<string, any>, K extends keyof T> {
  optionKey: K;
  optionValue: K;
  options: readonly T[];
  surfaceProps: TFloatingListElementProps;
  templateOption?(option: T): React.ReactNode;
  value: T[K] | undefined;
  onChange(value: string | number): void;
  renderSurface(options: IRenderSurfaceOptions): React.ReactElement;
}

export const OptionList = <T extends Record<string, any>, K extends keyof T>({
  optionKey,
  optionValue,
  options,
  surfaceProps,
  templateOption,
  value,
  onChange,
  renderSurface,
}: IProps<T, K>): React.ReactElement => {
  if (options.length === 0) {
    return renderSurface({
      children: <Empty title={'Нет данных'} />,
      listProps: {},
      surfaceProps,
    });
  }

  return (
    <Floating.Select
      getItemValue={(option) => option[optionKey] as string | number}
      items={options}
      value={value as string | number | undefined}
      onChange={onChange}
    >
      {(selectState) => {
        const listProps = selectState.getInnerProps();
        const listNode = (
          <div {...listProps} className={listProps.className}>
            {selectState.items.map((itemState) => {
              const itemProps = itemState.getItemProps({
                className: s.option,
                style: itemState.style,
              });

              return (
                <div key={String(itemState.value)} {...itemProps}>
                  <div
                    className={cn(s.container, {
                      [s.active]: itemState.isActive,
                      [s.selected]: itemState.isSelected,
                    })}
                  >
                    <div className={s.content}>
                      {templateOption ? (
                        templateOption(itemState.item)
                      ) : (
                        <Option title={String(itemState.item[optionValue])} />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        );

        return renderSurface({
          children: listNode,
          listProps: selectState.getListProps(),
          surfaceProps,
        });
      }}
    </Floating.Select>
  );
};
