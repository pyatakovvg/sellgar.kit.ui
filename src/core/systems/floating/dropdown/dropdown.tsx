import React from 'react';

import { Empty } from './empty';
import { Option } from './option';
import { Placeholder } from '../../../components/controls/select/placeholder';
import { DropdownInput } from '../internals/dropdown-input';
import { Select as SelectHelper } from '../internals/floating-select';

export interface IProps<T extends Record<string, any>, K extends keyof T> {
  leadIcon?: React.ReactNode;
  tailIcon?: React.ReactNode;
  badge?: string | number;
  size?: 'xs' | 'md';
  fixHeight?: boolean;
  target?: 'destructive';
  optionKey: K;
  optionValue: K;
  options: T[];
  value?: T[K];
  tabIndex?: number;
  placeholder?: string;
  disabled?: boolean;
  isClearable?: boolean;
  templateValue?(option?: T): React.ReactNode;
  templateOption?(option: T): React.ReactNode;
  onChange?: (value: T[K] | undefined) => void;
  onFocus?: () => void;
  onBlur?: () => void;
}

const findOption = <T extends Record<string, any>, K extends keyof T>(
  options: T[],
  optionKey: K,
  value: T[K],
): number | undefined => {
  return options.findIndex((option) => option[optionKey] === value);
};

export const Dropdown = <T extends Record<string, any>, K extends keyof T>({
  value,
  placeholder,
  tabIndex,
  options,
  optionKey,
  optionValue,
  templateValue,
  onBlur,
  onFocus,
  onChange,
  disabled,
  isClearable,
}: IProps<T, K>) => {
  const [initialize, setInitialize] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const [selectedIndex, setSelectedIndex] = React.useState<number | null>(
    value ? (findOption(options, optionKey, value) ?? null) : null,
  );
  const optionSelected = React.useMemo(
    () => (selectedIndex !== undefined && selectedIndex !== null ? options[selectedIndex] : undefined),
    [options, selectedIndex],
  );

  React.useEffect(() => {
    if (initialize) {
      setSelectedIndex(value ? (findOption(options, optionKey, value) ?? null) : null);
    }
  }, [value]);

  React.useEffect(() => {
    if (disabled) {
      return void 0;
    }

    if (initialize) {
      if (open) {
        onFocus && onFocus();
      } else {
        onBlur && onBlur();
      }
    }
  }, [open]);

  React.useEffect(() => {
    if (disabled && open) {
      setOpen(false);
    }
  }, [disabled]);

  React.useEffect(() => {
    setInitialize(true);
  }, []);

  const handleSelectIndex = (index: number | null) => {
    setSelectedIndex(index);
    onChange && onChange(index !== null && index !== undefined ? options[index]?.[optionKey] : undefined);
  };

  return (
    <SelectHelper
      tabIndex={tabIndex}
      open={open}
      disabled={disabled}
      initialSelectedIndex={selectedIndex}
      selectedIndex={selectedIndex}
      setOpen={setOpen}
      onSelect={handleSelectIndex}
    >
      <SelectHelper.Reference
        reference={(select) => {
          return (
            <DropdownInput
              disabled={disabled}
              isOpen={open}
              isClearable={selectedIndex !== null && isClearable}
              onClear={() => {
                if (disabled) {
                  return void 0;
                }
                handleSelectIndex(null);
                select.setSelectedIndex(null);
              }}
            >
              {optionSelected ? (
                templateValue ? (
                  templateValue(optionSelected)
                ) : (
                  <Option title={optionSelected[optionValue]} disabled={disabled} />
                )
              ) : (
                <Placeholder title={placeholder ?? 'Select...'} />
              )}
            </DropdownInput>
          );
        }}
      />
      <SelectHelper.Options
        empty={<Empty title={'Нет данных'} />}
        options={(selectOptions) => {
          return options.map((option, optionIndex) => {
            return (
              <SelectHelper.Option
                key={option[optionKey]}
                index={optionIndex}
                onClick={() => {
                  selectOptions.setOpen(false);
                }}
                onChange={() => {
                  selectOptions.setOpen(false);
                }}
                option={() => <Option title={option[optionValue]} />}
              />
            );
          });
        }}
      />
    </SelectHelper>
  );
};
