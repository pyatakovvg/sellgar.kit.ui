import React from 'react';

import type { MultiSelectProps } from './multi-select.props.tsx';

export const useMultiSelect = <T extends Record<string, any>, K extends keyof T>({
  value,
  options,
  optionKey,
  onChange,
}: MultiSelectProps<T, K>) => {
  const [open, setOpen] = React.useState(false);
  const [isFocused, setIsFocused] = React.useState(false);
  const [selectedValues, setSelectedValues] = React.useState<T[K][]>(value ?? []);

  const isAllSelected = React.useMemo(() => {
    return selectedValues.length === options.length && options.length > 0;
  }, [options.length, selectedValues.length]);

  const handleSelect = React.useCallback(
    (optionValue: T[K]) => {
      let nextValues: T[K][];

      if (selectedValues.includes(optionValue)) {
        nextValues = selectedValues.filter((selectedValue) => selectedValue !== optionValue);
      } else {
        nextValues = [...selectedValues, optionValue];
      }

      setSelectedValues(nextValues);
      onChange?.(nextValues);
    },
    [onChange, selectedValues],
  );

  const handleSelectAll = React.useCallback(() => {
    if (isAllSelected) {
      setSelectedValues([]);
      onChange?.([]);
      return;
    }

    const allValues = options.map((option) => option[optionKey]);

    setSelectedValues(allValues);
    onChange?.(allValues);
  }, [isAllSelected, onChange, optionKey, options]);

  React.useEffect(() => {
    if (value === void 0) {
      return;
    }

    setSelectedValues((previousValues) => {
      if (
        previousValues.length === value.length &&
        previousValues.every((previousValue, index) => previousValue === value[index])
      ) {
        return previousValues;
      }

      return value;
    });
  }, [value]);

  return {
    handleSelect,
    handleSelectAll,
    isAllSelected,
    isFocused,
    open,
    selectedValues,
    setIsFocused,
    setOpen,
    setSelectedValues,
  };
};
