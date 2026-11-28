import React from 'react';

import { Status } from '../status';
import { useEndReached } from '../hooks/use-end-reached.hook';
import { Option } from '../option';
import { Input } from '../../input';
import { Floating } from '../../../../systems/floating';
import { Animate } from '../../../feedback/animate';
import { Loader4FillIcon } from '../../../../../icons';

import cn from 'classnames';
import s from './default.module.scss';
import pagination from './pagination.module.css';

import type { TFloatingListElementProps } from '../../../../systems/floating';

interface IRenderSurfaceOptions {
  children: React.ReactNode;
  listProps: TFloatingListElementProps;
  search: React.ReactNode;
  surfaceProps: TFloatingListElementProps;
}

interface IProps<T extends Record<K, string | number>, K extends keyof T> {
  optionKey: K;
  optionValue: K;
  options: readonly T[];
  search: string;
  pending: boolean;
  loading: boolean;
  loadingMore: boolean;
  error?: string;
  searchPlaceholder: string;
  surfaceProps: TFloatingListElementProps;
  templateOption?(option: T): React.ReactNode;
  value: T[K] | undefined;
  onChange(option: T): void;
  onSearch(value: string): void;
  onEndReached?(): void;
  onClose(): void;
  renderSurface(options: IRenderSurfaceOptions): React.ReactElement;
}

export const OptionList = <T extends Record<K, string | number>, K extends keyof T>(props: IProps<T, K>) => {
  const listId = React.useId();
  const searchRef = React.useRef<HTMLInputElement>(null);
  const busy = props.pending || props.loading;
  const endRef = useEndReached(props.options.length, busy || props.loadingMore || !!props.error, props.onEndReached);

  return (
    <Floating.Select
      getItemValue={(option) => option[props.optionKey]}
      items={busy || props.error ? [] : props.options}
      value={props.value}
      onChange={(_key, meta) => props.onChange(meta.item)}
    >
      {(selectState) => {
        const listProps = selectState.getListProps({ id: listId });
        const activeOption = selectState.items.find((item) => item.isActive);
        const activeOptionId = activeOption?.getItemProps().id;
        const search = (
          <Input
            ref={searchRef}
            aria-activedescendant={activeOptionId}
            aria-busy={busy || props.loadingMore}
            aria-controls={listId}
            aria-expanded={true}
            aria-haspopup={'listbox'}
            aria-label={props.searchPlaceholder}
            autoComplete={'off'}
            autoFocus={true}
            placeholder={props.searchPlaceholder}
            role={'combobox'}
            size={'xs'}
            tailIcon={
              props.loading || props.loadingMore ? (
                <Animate.Spin>
                  <Loader4FillIcon />
                </Animate.Spin>
              ) : undefined
            }
            value={props.search}
            onChange={(event) => {
              props.onSearch(event.currentTarget.value);
            }}
          />
        );
        const surfaceProps: TFloatingListElementProps = {
          ...props.surfaceProps,
          onKeyDown: (event) => {
            props.surfaceProps.onKeyDown?.(event);

            if (event.target !== searchRef.current || event.nativeEvent.isComposing || event.defaultPrevented) {
              return;
            }

            if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
              listProps.onKeyDown?.(event);
            } else if (event.key === 'Enter') {
              event.preventDefault();

              if (!busy && activeOption) {
                props.onChange(activeOption.item);
                props.onClose();
              }
            }
          },
        };
        const innerProps = selectState.getInnerProps();
        const listNode = (
          <div {...innerProps} className={innerProps.className}>
            {selectState.items.length === 0 ? (
              <Status loading={props.loading} pending={props.pending} error={props.error} search={props.search} />
            ) : (
              selectState.items.map((itemState) => {
                const itemProps = itemState.getItemProps({ className: s.option, style: itemState.style });
                const containerClassName = cn(s.container, {
                  [s.active]: itemState.isActive,
                  [s.selected]: itemState.isSelected,
                });

                return (
                  <div key={String(itemState.value)} {...itemProps}>
                    <div className={containerClassName}>
                      <div className={s.content}>
                        {props.templateOption ? (
                          props.templateOption(itemState.item)
                        ) : (
                          <Option title={String(itemState.item[props.optionValue])} />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            {selectState.items.length > 0 && props.onEndReached && (
              <div ref={endRef} className={pagination.end} aria-hidden={true} />
            )}
          </div>
        );

        return props.renderSurface({ children: listNode, listProps, search, surfaceProps });
      }}
    </Floating.Select>
  );
};
