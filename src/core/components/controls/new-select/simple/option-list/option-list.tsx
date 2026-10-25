import React from 'react';

import { SelectOption } from '../../../../navigation/select-option';
import { Empty } from '../../../select/empty';

import type { TFloatingListItemState } from '../../../../../systems/floating';

import s from './default.module.scss';

interface IProps<TOption> {
  items: readonly TFloatingListItemState<{ id: string; option: TOption }>[];
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
          <div key={item.value} {...item.getItemProps({ className: s.option })}>
            {props.renderOption ? (
              props.renderOption(item.item.option, {
                index: item.index,
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
              />
            )}
          </div>
        ))
      )}
    </div>
  );
};
