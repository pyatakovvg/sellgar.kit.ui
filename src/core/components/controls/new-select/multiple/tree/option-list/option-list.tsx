import React from 'react';

import { Badge } from '../../../../../status/badge';
import { Divider } from '../../../../../layout/divider';
import { Empty } from '../../../../multi-select/empty';
import { TreeOption } from './tree-option';

import type { ITreeEntry } from '../../../../../../systems/tree';
import type { TFloatingListItemState } from '../../../../../../systems/floating';

import s from './default.module.scss';

interface IProps<TOption> {
  items: readonly TFloatingListItemState<
    { kind: 'select-all'; id: string } | (ITreeEntry<TOption> & { kind: 'option' })
  >[];
  branchStates: ReadonlyMap<string, { total: number; selected: number }>;
  expandedIds: ReadonlySet<string>;
  optionsCount: number;
  selectAllEnabled: boolean;
  selectAllText: string;
  isPartiallySelected: boolean;
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
      isIndeterminate: boolean;
      onCheck(): void;
      onToggle(): void;
    },
  ): React.ReactNode;
  onToggle(id: string): void;
  onCheck(id: string): void;
}

export const OptionList = <TOption,>(props: IProps<TOption>): React.ReactElement => {
  return (
    <div className={s.wrapper}>
      {props.items.length === 0 ? (
        <Empty title={'Нет данных'} />
      ) : (
        props.items.map((item) => {
          if (item.item.kind === 'select-all')
            return (
              <div key={item.value} className={s.item}>
                <div
                  {...item.getItemProps({
                    className: s.option,
                    'aria-level': 1,
                    'aria-checked': props.isPartiallySelected ? 'mixed' : item.isSelected,
                  })}
                >
                  <TreeOption
                    active={item.isActive}
                    badge={<Badge label={props.optionsCount} />}
                    checked={item.isSelected}
                    disabled={item.isDisabled}
                    indeterminate={props.isPartiallySelected}
                    label={props.selectAllText}
                    onCheck={() => props.onCheck('select-all')}
                  />
                </div>
                <Divider />
              </div>
            );
          const entry = item.item;
          const state = props.branchStates.get(entry.id);
          const isBranch = entry.childrenIds.length > 0;
          const isExpanded = props.expandedIds.has(entry.id);
          const isIndeterminate = state !== void 0 && state.selected > 0 && state.selected < state.total;
          const handleToggle = (): void => props.onToggle(entry.id);
          return (
            <div
              key={item.value}
              {...item.getItemProps({
                className: s.option,
                'aria-level': entry.depth + 1,
                'aria-posinset': entry.position + (entry.depth === 0 && props.selectAllEnabled ? 1 : 0),
                'aria-setsize': entry.siblingsCount + (entry.depth === 0 && props.selectAllEnabled ? 1 : 0),
                'aria-expanded': isBranch ? isExpanded : void 0,
                'aria-checked': isIndeterminate ? 'mixed' : item.isSelected,
              })}
            >
              {entry.ancestorIds.map((id) => (
                <span key={id} aria-hidden={true} className={s.indent} />
              ))}
              {props.renderOption ? (
                props.renderOption(entry.option, {
                  index: item.index - (props.selectAllEnabled ? 1 : 0),
                  depth: entry.depth,
                  isActive: item.isActive,
                  isDisabled: entry.disabled,
                  isSelected: item.isSelected,
                  isBranch,
                  isExpanded,
                  isIndeterminate,
                  onCheck: () => props.onCheck(entry.id),
                  onToggle: handleToggle,
                })
              ) : (
                <TreeOption
                  active={item.isActive}
                  checked={item.isSelected}
                  disabled={entry.disabled}
                  expanded={isBranch ? isExpanded : void 0}
                  indeterminate={isIndeterminate}
                  label={props.resolveValue(entry.option)}
                  onCheck={() => props.onCheck(entry.id)}
                  onToggle={handleToggle}
                />
              )}
            </div>
          );
        })
      )}
    </div>
  );
};
