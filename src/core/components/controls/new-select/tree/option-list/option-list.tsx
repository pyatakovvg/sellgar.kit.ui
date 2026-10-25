import React from 'react';

import { ArrowDownSLineIcon, ArrowUpSLineIcon } from '../../../../../../icons';
import { SelectOption } from '../../../../navigation/select-option';
import { Empty } from '../../../select/empty';

import type { ITreeEntry } from '../../../../../systems/tree';
import type { TFloatingListItemState } from '../../../../../systems/floating';

import s from './default.module.scss';

interface IProps<TOption> {
  items: readonly TFloatingListItemState<ITreeEntry<TOption>>[];
  expandedIds: ReadonlySet<string>;
  resolveValue(option: TOption): React.ReactNode;
  renderOption?(
    option: TOption,
    meta: {
      index: number;
      depth: number;
      isActive: boolean;
      isDisabled: boolean;
      isSelected: boolean;
      isBranch: boolean;
      isExpanded: boolean;
    },
  ): React.ReactNode;
}

export const OptionList = <TOption,>(props: IProps<TOption>): React.ReactElement => {
  return (
    <div className={s.wrapper}>
      {props.items.length === 0 ? (
        <Empty title={'Нет данных'} />
      ) : (
        props.items.map((item) => {
          const isBranch = item.item.childrenIds.length > 0;
          const isExpanded = props.expandedIds.has(item.item.id);
          return (
            <div
              key={item.value}
              {...item.getItemProps({
                className: s.option,
                'aria-level': item.item.depth + 1,
                'aria-posinset': item.item.position,
                'aria-setsize': item.item.siblingsCount,
                'aria-expanded': isBranch ? isExpanded : void 0,
                'aria-selected': isBranch ? void 0 : item.isSelected,
              })}
            >
              {item.item.ancestorIds.map((id) => (
                <span key={id} aria-hidden={true} className={s.indent} />
              ))}
              {props.renderOption ? (
                props.renderOption(item.item.option, {
                  index: item.index,
                  depth: item.item.depth,
                  isActive: item.isActive,
                  isDisabled: item.item.disabled,
                  isSelected: item.isSelected,
                  isBranch,
                  isExpanded,
                })
              ) : (
                <SelectOption
                  active={item.isActive}
                  disabled={item.isDisabled}
                  label={props.resolveValue(item.item.option)}
                  selected={item.isSelected}
                  tailIcon={isBranch ? isExpanded ? <ArrowUpSLineIcon /> : <ArrowDownSLineIcon /> : void 0}
                />
              )}
            </div>
          );
        })
      )}
    </div>
  );
};
