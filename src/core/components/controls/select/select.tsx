import React from 'react';

import { OptionList } from './option-list';
import { Option } from './option';
import { Placeholder } from './placeholder';
import { Surface } from './surface';
import { SelectInput } from '../../../systems/floating/internals/select-input';
import { Floating } from '../../../systems/floating';

import type { TFloatingListElementProps } from '../../../systems/floating';

export interface IProps<T extends Record<string, any>, K extends keyof T> {
  leadIcon?: React.ReactNode;
  tailIcon?: React.ReactNode;
  badge?: React.ReactNode;
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
  options: readonly T[],
  optionKey: K,
  value: T[K] | undefined,
): T | undefined => {
  if (value === void 0) {
    return void 0;
  }

  return options.find((option) => Object.is(option[optionKey], value));
};

export const Select = <T extends Record<string, any>, K extends keyof T>({
  value,
  placeholder,
  tabIndex,
  options,
  optionKey,
  optionValue,
  templateValue,
  templateOption,
  onBlur,
  onFocus,
  onChange,
  disabled,
  isClearable,
  ...props
}: IProps<T, K>) => {
  const [initialize, setInitialize] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const [selectedValue, setSelectedValue] = React.useState<T[K] | undefined>(value);
  const optionSelected = React.useMemo(
    () => findOption(options, optionKey, selectedValue),
    [optionKey, options, selectedValue],
  );

  React.useEffect(() => {
    if (initialize) {
      setSelectedValue(value);
    }
  }, [initialize, value]);

  React.useEffect(() => {
    if (disabled && open) {
      setOpen(false);
    }
  }, [disabled, open]);

  React.useEffect(() => {
    if (!initialize || disabled) {
      return void 0;
    }

    if (open) {
      onFocus?.();
      return void 0;
    }

    onBlur?.();
  }, [disabled, initialize, onBlur, onFocus, open]);

  React.useEffect(() => {
    setInitialize(true);
  }, []);

  const handleChange = React.useCallback(
    (nextValue: string | number) => {
      const nextOption = options.find((option) => Object.is(option[optionKey], nextValue));

      setSelectedValue(nextOption?.[optionKey]);
      onChange?.(nextOption?.[optionKey]);
    },
    [onChange, optionKey, options],
  );

  const handleClear = React.useCallback(() => {
    if (disabled) {
      return;
    }

    setSelectedValue(void 0);
    onChange?.(void 0);
  }, [disabled, onChange]);

  return (
    <Floating
      disabled={disabled}
      initialFocus={-1}
      open={open}
      placement={'bottom-start'}
      presentation={'auto'}
      returnFocus={false}
      role={'listbox'}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
      }}
    >
      <Floating.Trigger>
        <SelectInput
          {...props}
          aria-expanded={open}
          aria-haspopup={'listbox'}
          disabled={disabled}
          isClearable={optionSelected !== void 0 && isClearable}
          isOpen={open}
          tabIndex={tabIndex}
          onClear={handleClear}
        >
          {optionSelected ? (
            templateValue ? (
              templateValue(optionSelected)
            ) : (
              <Option disabled={disabled} title={String(optionSelected[optionValue])} />
            )
          ) : (
            <Placeholder title={placeholder ?? 'Select...'} />
          )}
        </SelectInput>
      </Floating.Trigger>

      <Floating.Content matchReferenceWidth minWidth={240}>
        {(contentState) => {
          const surfaceProps: TFloatingListElementProps = {
            ...contentState.getContentProps(),
            ref: contentState.ref as React.Ref<HTMLDivElement | null>,
            style: {
              ...contentState.floatingStyles,
              ...contentState.transitionStyles,
            },
          };

          return (
            <OptionList
              optionKey={optionKey}
              optionValue={optionValue}
              options={options}
              surfaceProps={surfaceProps}
              templateOption={templateOption}
              value={selectedValue}
              onChange={handleChange}
              renderSurface={({ children, listProps, surfaceProps: nextSurfaceProps }) => {
                return (
                  <Surface
                    listProps={listProps}
                    placeholder={placeholder}
                    presentation={contentState.presentation}
                    props={nextSurfaceProps}
                    onClose={() => setOpen(false)}
                  >
                    {children}
                  </Surface>
                );
              }}
            />
          );
        }}
      </Floating.Content>
    </Floating>
  );
};
