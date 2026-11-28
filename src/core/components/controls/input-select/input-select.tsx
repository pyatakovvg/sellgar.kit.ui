import React from 'react';

import { OptionList } from './option-list';
import { Option } from './option';
import { Placeholder } from './placeholder';
import { Surface } from './surface';
import { SelectInput } from '../../../systems/floating/internals/select-input';
import { Floating } from '../../../systems/floating';
import { useSearch } from './hooks/use-search.hook';

import type { TFloatingListElementProps } from '../../../systems/floating';

interface IProps<T extends Record<K, string | number>, K extends keyof T> extends Omit<
  React.ComponentProps<typeof SelectInput>,
  'children' | 'className' | 'style' | 'onChange' | 'onClear' | 'onBlur' | 'onFocus' | 'isOpen' | 'role'
> {
  optionKey: K;
  optionValue: K;
  options: T[];
  value: T | null;
  debounce?: number;
  loading?: boolean;
  loadingMore?: boolean;
  error?: string;
  placeholder?: string;
  searchPlaceholder?: string;
  templateValue?(option: T): React.ReactNode;
  templateOption?(option: T): React.ReactNode;
  onChange(value: T | null): void;
  onSearch(value: string): void;
  onEndReached?(): void;
  onFocus?(): void;
  onBlur?(): void;
}

export const InputSelect = <T extends Record<K, string | number>, K extends keyof T>({
  optionKey,
  optionValue,
  options,
  value,
  debounce = 600,
  loading = false,
  loadingMore = false,
  error,
  placeholder = 'Выберите значение',
  searchPlaceholder = 'Поиск',
  templateValue,
  templateOption,
  onChange,
  onSearch,
  onEndReached,
  onFocus,
  onBlur,
  disabled,
  isClearable,
  ...props
}: IProps<T, K>) => {
  const [open, setOpen] = React.useState(false);
  const search = useSearch(onSearch, debounce);

  const handleOpen = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (nextOpen) {
      onFocus?.();
    } else {
      search.reset();
      onBlur?.();
    }
  };

  React.useEffect(() => {
    if (disabled && open) {
      setOpen(false);
      search.reset();
      onBlur?.();
    }
  }, [disabled, open, search.reset, onBlur]);

  return (
    <Floating
      disabled={disabled}
      initialFocus={-1}
      open={open}
      placement={'bottom-start'}
      presentation={'auto'}
      returnFocus={true}
      role={'dialog'}
      onOpenChange={handleOpen}
    >
      <Floating.Trigger>
        <SelectInput
          {...props}
          aria-expanded={open}
          aria-haspopup={'dialog'}
          disabled={disabled}
          isClearable={value !== null && isClearable}
          isOpen={open}
          role={'button'}
          onClear={() => {
            if (!disabled) {
              onChange(null);
            }
          }}
        >
          {value ? (
            templateValue ? (
              templateValue(value)
            ) : (
              <Option disabled={disabled} title={String(value[optionValue])} />
            )
          ) : (
            <Placeholder title={placeholder} />
          )}
        </SelectInput>
      </Floating.Trigger>

      <Floating.Content matchReferenceWidth minWidth={240}>
        {(contentState) => {
          const surfaceProps: TFloatingListElementProps = {
            ...contentState.getContentProps(),
            ref: contentState.ref,
            style: {
              ...contentState.floatingStyles,
              ...contentState.transitionStyles,
            },
          };

          return (
            <OptionList<T, K>
              optionKey={optionKey}
              optionValue={optionValue}
              options={options}
              search={search.search}
              pending={search.pending}
              loading={loading}
              loadingMore={loadingMore}
              error={error}
              searchPlaceholder={searchPlaceholder}
              surfaceProps={surfaceProps}
              templateOption={templateOption}
              value={value?.[optionKey]}
              onChange={onChange}
              onSearch={search.change}
              onEndReached={onEndReached}
              onClose={() => handleOpen(false)}
              renderSurface={({ children, listProps, search: searchNode, surfaceProps: nextSurfaceProps }) => (
                <Surface
                  listProps={listProps}
                  placeholder={placeholder}
                  presentation={contentState.presentation}
                  props={nextSurfaceProps}
                  search={searchNode}
                  onClose={() => handleOpen(false)}
                >
                  {children}
                </Surface>
              )}
            />
          );
        }}
      </Floating.Content>
    </Floating>
  );
};
