import React from 'react';

import { Select } from '../select';
import { TreeOption } from '../tree-option';
import { mapTreeOptions } from '../../../../shared/utils/tree-options/tree-options.mapper';

interface IProps<
  T extends Record<K, string | number> & Partial<Record<A, readonly T[] | null>>,
  K extends keyof T,
  A extends keyof T,
> extends Omit<
  React.ComponentProps<typeof Select>,
  'options' | 'optionKey' | 'optionValue' | 'value' | 'onChange' | 'templateOption' | 'templateValue'
> {
  accessor: A;
  optionKey: K;
  optionValue: keyof T;
  options: readonly T[];
  value?: T[K];
  onChange?: (value: T[K] | undefined) => void;
  templateOption?: (option: T) => React.ReactNode;
  templateValue?: (option?: T) => React.ReactNode;
}

export const SelectTree = <
  T extends Record<K, string | number> & Partial<Record<A, readonly T[] | null>>,
  K extends keyof T,
  A extends keyof T,
>({
  accessor,
  optionKey,
  optionValue,
  options,
  value,
  onChange,
  templateOption,
  templateValue,
  ...selectProps
}: IProps<T, K, A>) => {
  const treeOptions = React.useMemo(
    () => mapTreeOptions(options, optionKey, optionValue, accessor),
    [options, optionKey, optionValue, accessor],
  );

  return (
    <Select<(typeof treeOptions)[number], 'key' | 'label'>
      {...selectProps}
      optionKey={'key'}
      optionValue={'label'}
      options={treeOptions}
      value={value}
      templateOption={(item) =>
        templateOption ? templateOption(item.option) : <TreeOption depth={item.depth} title={item.label} />
      }
      templateValue={templateValue ? (item) => templateValue(item?.option) : undefined}
      onChange={(key) => {
        const selected = treeOptions.find((item) => Object.is(item.key, key));
        onChange?.(selected?.option[optionKey]);
      }}
    />
  );
};
