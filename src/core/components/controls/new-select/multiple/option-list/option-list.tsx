import React from 'react';

import { Badge } from '../../../../status/badge';
import { Divider } from '../../../../layout/divider';
import { SelectOption } from '../../../../navigation/select-option';
import { Empty } from '../../../multi-select/empty';

import type { TFloatingListItemState } from '../../../../../systems/floating';

import s from './default.module.scss';

interface IProps<TOption> {
  items: readonly TFloatingListItemState<
    { kind: 'select-all'; id: string } | { kind: 'option'; id: string; option: TOption }
  >[];
  optionsCount: number;
  selectAllEnabled: boolean;
  selectAllText: string;
  isPartiallySelected: boolean;
  resolveValue(option: TOption): React.ReactNode;
  renderOption?(
    option: TOption,
    meta: { index: number; isActive: boolean; isDisabled: boolean; isSelected: boolean },
  ): React.ReactNode;
}

export const OptionList = <TOption,>(props: IProps<TOption>): React.ReactElement => {
  return (
    <div className={s.wrapper}>
      {props.items.length === 0 ? (
        <Empty title={'Нет данных'} />
      ) : (
        props.items.map((item) => (
          <div key={item.value} className={s.item}>
            <div {...item.getItemProps({ className: s.option })}>
              {item.item.kind === 'select-all' ? (
                <SelectOption
                  active={item.isActive}
                  badge={<Badge label={props.optionsCount} />}
                  disabled={item.isDisabled}
                  isIndeterminate={props.isPartiallySelected}
                  label={props.selectAllText}
                  selected={item.isSelected || props.isPartiallySelected}
                  selection={'multiple'}
                />
              ) : props.renderOption ? (
                props.renderOption(item.item.option, {
                  index: item.index - (props.selectAllEnabled ? 1 : 0),
                  isActive: item.isActive,
                  isDisabled: item.isDisabled,
                  isSelected: item.isSelected,
                })
              ) : (
                <SelectOption
                  active={item.isActive}
                  disabled={item.isDisabled}
                  label={props.resolveValue(item.item.option)}
                  selected={item.isSelected}
                  selection={'multiple'}
                />
              )}
            </div>
            {item.item.kind === 'select-all' ? <Divider /> : null}
          </div>
        ))
      )}
    </div>
  );
};
