import React from 'react';

import { Option } from '../../../navigation/option';
import { Surface } from '../../select/surface';
import { Placeholder } from '../../select/placeholder';
import { SelectInput } from '../../../../systems/floating/internals/select-input';
import { Floating } from '../../../../systems/floating';

import { useTree } from '../../../../systems/tree';
import { OptionList } from './option-list';

import s from './default.module.scss';

interface IBaseProps<TOption> extends Omit<
  React.ComponentProps<typeof SelectInput>,
  | 'children'
  | 'className'
  | 'style'
  | 'defaultValue'
  | 'onChange'
  | 'onClear'
  | 'isClearable'
  | 'isOpen'
  | 'isFocused'
  | 'isKeyboardFocused'
> {
  options: readonly TOption[];
  placeholder?: string;
  clearable?: boolean;
  defaultExpanded?: boolean;
  resolveValue(option: TOption): React.ReactNode;
  resolveChildren(option: TOption): readonly TOption[] | undefined;
  renderOption?: React.ComponentProps<typeof OptionList<TOption>>['renderOption'];
  renderTrigger?(state: { open: boolean; disabled: boolean; selectedOption: TOption | undefined }): React.ReactElement;
  isOptionDisabled?(option: TOption): boolean;
}

interface IOptionProps<TOption> {
  resolveKey?: undefined;
  value?: NoInfer<TOption>;
  isValueEqual?(left: NoInfer<TOption>, right: NoInfer<TOption>): boolean;
  onChange?(value: NoInfer<TOption> | undefined): void;
}

interface IResultProps<TOption, TResult> {
  resolveKey(option: TOption): TResult;
  value?: NoInfer<TResult>;
  isValueEqual?(left: NoInfer<TResult>, right: NoInfer<TResult>): boolean;
  onChange?(value: NoInfer<TResult> | undefined): void;
}

type IProps<TOption, TResult = TOption> = IBaseProps<TOption> &
  (IOptionProps<TOption> | IResultProps<TOption, TResult>);

interface IComponent {
  <TOption>(props: IBaseProps<TOption> & IOptionProps<TOption>): React.ReactElement;
  <TOption, TResult>(props: IBaseProps<TOption> & IResultProps<TOption, TResult>): React.ReactElement;
}

const resolveOption = <TOption,>(option: TOption): TOption => option;

const findSelectedOption = <TOption, TResult>(
  options: readonly { id: string; option: TOption }[],
  value: TResult | undefined,
  resolveKey: (option: TOption) => TResult,
  isValueEqual: (left: TResult, right: TResult) => boolean = Object.is,
) => {
  if (value === void 0) {
    return void 0;
  }

  return options.find((entry) => isValueEqual(resolveKey(entry.option), value));
};

const mapInputProps = <TOption, TResult>({
  options: _options,
  resolveChildren: _resolveChildren,
  resolveKey: _resolveKey,
  resolveValue: _resolveValue,
  renderOption: _renderOption,
  renderTrigger: _renderTrigger,
  isOptionDisabled: _isOptionDisabled,
  isValueEqual: _isValueEqual,
  value: _value,
  onChange: _onChange,
  ...props
}: Omit<IProps<TOption, TResult>, 'placeholder' | 'clearable' | 'defaultExpanded'>) => props;

export const TreeSelect: IComponent = <TOption, TResult = TOption>({
  placeholder = 'Select...',
  clearable = false,
  defaultExpanded = true,
  ...props
}: IProps<TOption, TResult>): React.ReactElement => {
  const [open, setOpen] = React.useState(false);
  const tree = useTree(props.options, props.resolveChildren, defaultExpanded, props.isOptionDisabled);
  const options = tree.entries.filter((entry) => entry.childrenIds.length === 0);
  const selectedOption =
    props.resolveKey === void 0
      ? findSelectedOption(options, props.value, resolveOption, props.isValueEqual)
      : findSelectedOption(options, props.value, props.resolveKey, props.isValueEqual);
  const inputProps = mapInputProps(props);

  React.useEffect(() => {
    if (props.disabled) {
      setOpen(false);
    }
  }, [props.disabled]);

  const handleSelect = (option: TOption): void => {
    if (props.disabled || props.isOptionDisabled?.(option)) {
      return;
    }

    if (props.resolveKey === void 0) {
      props.onChange?.(option);
    } else {
      props.onChange?.(props.resolveKey(option));
    }
  };

  const handleClear = (): void => {
    if (!props.disabled) {
      props.onChange?.(void 0);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>): void => {
    props.onKeyDown?.(event);

    if (event.defaultPrevented || !clearable || props.disabled) {
      return;
    }

    if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault();
      handleClear();
    }
  };

  return (
    <Floating
      disabled={props.disabled}
      initialFocus={-1}
      open={open && !props.disabled}
      presentation={'auto'}
      role={'tree'}
      onOpenChange={setOpen}
    >
      <Floating.List
        activeIndex={tree.activeIndex}
        closeOnSelect={false}
        loop={false}
        role={'tree'}
        onNavigate={tree.handleNavigate}
        onKeyDown={tree.handleKeyDown}
        disabled={props.disabled}
        getItemDisabled={(entry) => entry.disabled && entry.childrenIds.length === 0}
        getItemValue={(entry) => entry.id}
        items={tree.visibleEntries}
        scrollItemIntoView={{ block: 'center', inline: 'nearest' }}
        value={selectedOption?.id ?? -1}
        onItemSelect={({ item }) => {
          if (item.childrenIds.length > 0) tree.toggle(item.id);
          else {
            handleSelect(item.option);
            setOpen(false);
          }
        }}
      >
        {(list) => (
          <div className={s.wrapper}>
            <Floating.Trigger role={'combobox'}>
              {props.renderTrigger ? (
                props.renderTrigger({
                  open: open && !props.disabled,
                  disabled: props.disabled === true,
                  selectedOption: selectedOption?.option,
                })
              ) : (
                <SelectInput
                  {...inputProps}
                  role={'combobox'}
                  aria-expanded={open && !props.disabled}
                  aria-haspopup={'tree'}
                  isClearable={clearable && props.value !== void 0}
                  isFocused={open && !props.disabled}
                  isOpen={open && !props.disabled}
                  onClear={handleClear}
                  onKeyDown={handleKeyDown}
                >
                  {selectedOption !== void 0 ? (
                    <Option.Presentation disabled={props.disabled} label={props.resolveValue(selectedOption.option)} />
                  ) : (
                    <Placeholder title={placeholder} />
                  )}
                </SelectInput>
              )}
            </Floating.Trigger>

            <Floating.Content matchReferenceWidth={true} minWidth={240}>
              {(content) => (
                <Surface
                  listProps={list.getListProps(content.getContentProps())}
                  placeholder={placeholder}
                  presentation={content.presentation}
                  props={{
                    ref: content.ref,
                    style: { ...content.floatingStyles, ...content.transitionStyles },
                  }}
                  onClose={() => setOpen(false)}
                >
                  <OptionList
                    expandedIds={tree.expandedIds}
                    items={list.items}
                    renderOption={props.renderOption}
                    resolveValue={props.resolveValue}
                  />
                </Surface>
              )}
            </Floating.Content>
          </div>
        )}
      </Floating.List>
    </Floating>
  );
};
