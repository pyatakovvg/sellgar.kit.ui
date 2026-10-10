import React from 'react';

import { MultiSelect } from '../multi-select';
import { Option } from './option';
import { SelectedBadge } from './selected-badge';
import { mapTreeOptions } from '../../../../shared/utils/tree-options/tree-options.mapper';
import { changeTreeSelection, getPartialTreeSelection, normalizeTreeSelection } from './selection/tree-selection';

interface IProps<
  T extends Record<K, string | number> & Partial<Record<A, readonly T[] | null>>,
  K extends keyof T,
  A extends keyof T,
> extends Omit<
  React.ComponentProps<typeof MultiSelect>,
  'options' | 'optionKey' | 'optionValue' | 'value' | 'onChange' | 'templateOption' | 'templateValue' | 'renderBadge'
> {
  accessor: A;
  optionKey: K;
  optionValue: keyof T;
  options: readonly T[];
  value: readonly T[K][];
  onChange?: (value: T[K][]) => void;
  templateOption?: (option: T) => React.ReactNode;
  templateValue?: (option: T) => string | number;
  renderBadge?: (option: T, onRemove: () => void) => React.ReactNode;
}

export const MultiSelectTree = <
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
  renderBadge,
  disabled,
  ...selectProps
}: IProps<T, K, A>) => {
  const treeOptions = React.useMemo(
    () => mapTreeOptions(options, optionKey, optionValue, accessor),
    [options, optionKey, optionValue, accessor],
  );
  const selectedKeys = React.useMemo(() => normalizeTreeSelection(treeOptions, value), [treeOptions, value]);
  const selected = React.useMemo(() => new Set(selectedKeys), [selectedKeys]);
  const partial = React.useMemo(() => getPartialTreeSelection(treeOptions, selected), [treeOptions, selected]);

  return (
    <MultiSelect<(typeof treeOptions)[number], 'key' | 'label'>
      {...selectProps}
      disabled={disabled}
      options={treeOptions}
      optionKey={'key'}
      optionValue={'label'}
      value={selectedKeys}
      templateOption={(item) => (
        <Option
          depth={item.depth}
          title={item.label}
          checked={selected.has(item.key)}
          indeterminate={partial.has(item.key)}
          disabled={disabled}
        >
          {templateOption?.(item.option)}
        </Option>
      )}
      renderBadge={(item, remove) => {
        const onRemove = () => {
          if (!disabled) remove();
        };
        return renderBadge ? (
          renderBadge(item.option, onRemove)
        ) : (
          <SelectedBadge
            key={item.key}
            label={templateValue ? templateValue(item.option) : item.label}
            disabled={disabled}
            onRemove={onRemove}
          />
        );
      }}
      onChange={(keys) => {
        if (disabled) return;
        const nextKeys = new Set(changeTreeSelection(treeOptions, selectedKeys, keys));
        onChange?.(treeOptions.filter((item) => nextKeys.has(item.key)).map((item) => item.option[optionKey]));
      }}
    />
  );
};
