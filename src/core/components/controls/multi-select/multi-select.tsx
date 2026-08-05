import React from 'react';

import { CloseCircleFillIcon } from '../../../../icons';

import { SelectInput } from '../../../systems/floating/internals/select-input';
import { Floating } from '../../../systems/floating';

import { OptionList } from './option-list';
import { Placeholder } from './placeholder';
import { Surface } from './surface';
import { IMultiSelectInputProps } from './multi-select.props.tsx';

import { useMultiSelect } from './use-multi-select.tsx';
import { ButtonComponent } from './button/button-component.tsx';
import s from './default.module.scss';
import { Badge } from '../../status/badge';

import type { TFloatingListElementProps } from '../../../systems/floating';

const MultiSelectComponent = <T extends Record<string, any>, K extends keyof T>(
  props: IMultiSelectInputProps<T, K>,
) => {
  const {
    placeholder = 'Выберите значения',
    tabIndex,
    options,
    optionKey,
    optionValue,
    templateValue,
    templateOption: _templateOption,
    selectAllText: _selectAllText = 'Выбрать все',
    selectAllEnabled: _selectAllEnabled = true,
    maxDisplayBadges = 3,
    disabled = false,
    isClearable = true,
    fixHeight = false,
    renderBadge,
    mobileHeader,
    onChange,
    onFocus,
    onBlur,
    ...inputProps
  } = props;

  const [initialize, setInitialize] = React.useState(false);
  const {
    handleSelect,
    handleSelectAll,
    isAllSelected,
    isFocused,
    open,
    selectedValues,
    setIsFocused,
    setOpen,
    setSelectedValues,
  } = useMultiSelect(props);

  const selectedOptions = React.useMemo(() => {
    return options.filter((option) => selectedValues.includes(option[optionKey]));
  }, [options, selectedValues, optionKey]);

  React.useEffect(() => {
    if (disabled && open) {
      setOpen(false);
    }
  }, [disabled, open, setOpen]);

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

  const handleRemoveValue = (valueToRemove: T[K]) => {
    const newValues = selectedValues.filter((val) => val !== valueToRemove);
    setSelectedValues(newValues);
    onChange?.(newValues);
  };

  const renderBadges = () => {
    const badgesToShow = selectedOptions.slice(0, maxDisplayBadges);
    const remainingCount = selectedOptions.length - maxDisplayBadges;

    return (
      <div className={s.reference}>
        {badgesToShow.map((option) => {
          if (renderBadge) {
            return renderBadge(option, () => handleRemoveValue(option[optionKey]));
          }

          return (
            <Badge
              key={String(option[optionKey])}
              color="blue"
              size="sm"
              label={templateValue ? String(templateValue(option)) : option[optionValue]}
              tailIcon={
                <CloseCircleFillIcon
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveValue(option[optionKey]);
                  }}
                />
              }
            />
          );
        })}

        {remainingCount > 0 && <Badge color="gray" size="sm" label={`+ ещё ${remainingCount}`} />}
      </div>
    );
  };

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
          {...inputProps}
          aria-expanded={open}
          aria-haspopup={'listbox'}
          disabled={disabled}
          fixHeight={fixHeight}
          isClearable={selectedValues.length > 0 && isClearable}
          isFocused={isFocused || open}
          isOpen={open}
          tabIndex={tabIndex}
          onBlur={() => {
            setIsFocused(false);
          }}
          onClear={() => {
            if (disabled) {
              return void 0;
            }

            setSelectedValues([]);
            onChange?.([]);
          }}
          onFocus={() => {
            setIsFocused(true);
          }}
        >
          {selectedValues.length > 0 ? renderBadges() : <Placeholder title={placeholder} />}
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
              disabled={disabled}
              isAllSelected={isAllSelected}
              optionKey={optionKey}
              optionValue={optionValue}
              options={options}
              selectAllEnabled={_selectAllEnabled}
              selectAllText={_selectAllText}
              selectedValues={selectedValues}
              surfaceProps={surfaceProps}
              templateOption={_templateOption}
              onSelect={handleSelect}
              onSelectAll={handleSelectAll}
              renderSurface={({ children, listProps, surfaceProps: nextSurfaceProps }) => {
                return (
                  <Surface
                    actionLabel={'Применить'}
                    listProps={listProps}
                    placeholder={mobileHeader ?? placeholder}
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

type TMultiSelect = typeof MultiSelectComponent & {
  Button: typeof ButtonComponent;
};

export const MultiSelect: TMultiSelect = Object.assign(MultiSelectComponent, {
  Button: ButtonComponent,
});
