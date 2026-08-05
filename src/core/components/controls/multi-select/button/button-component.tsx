import React from 'react';

import { ArrowDownSLineIcon, ArrowUpSLineIcon } from '../../../../../icons';

import { Floating } from '../../../../systems/floating';
import { Button } from '../../../action/button';

import { OptionList } from '../option-list';
import { Surface } from '../surface';
import { useMultiSelect } from '../use-multi-select.tsx';

import type { IMultiSelectButtonProps } from '../multi-select.props.tsx';
import type { TFloatingListElementProps } from '../../../../systems/floating';

export const ButtonComponent = <T extends Record<string, any>, K extends keyof T>(
  props: IMultiSelectButtonProps<T, K>,
) => {
  const {
    tabIndex,
    options,
    optionKey,
    optionValue,
    templateOption,
    selectAllText = 'Выбрать все',
    selectAllEnabled = true,
    disabled = false,
    templateValue: _templateValue,
    renderBadge: _renderBadge,
    mobileHeader,
    onChange: _onChange,
    onFocus,
    onBlur,
    children,
    style = 'secondary',
    ...buttonProps
  } = props;

  void _renderBadge;
  void _templateValue;
  void _onChange;

  const [initialize, setInitialize] = React.useState(false);
  const { handleSelect, handleSelectAll, isAllSelected, open, selectedValues, setOpen } = useMultiSelect(props);

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
        <Button
          {...buttonProps}
          aria-expanded={open}
          aria-haspopup={'listbox'}
          data-qa={'multi-select.button'}
          disabled={disabled}
          style={style}
          tabIndex={tabIndex}
          tailIcon={open ? <ArrowUpSLineIcon /> : <ArrowDownSLineIcon />}
          type={'button'}
        >
          {children}
        </Button>
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
              selectAllEnabled={selectAllEnabled}
              selectAllText={selectAllText}
              selectedValues={selectedValues}
              surfaceProps={surfaceProps}
              templateOption={templateOption}
              onSelect={handleSelect}
              onSelectAll={handleSelectAll}
              renderSurface={({ children, listProps, surfaceProps: nextSurfaceProps }) => {
                return (
                  <Surface
                    actionLabel={'Применить'}
                    listProps={listProps}
                    placeholder={mobileHeader}
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
