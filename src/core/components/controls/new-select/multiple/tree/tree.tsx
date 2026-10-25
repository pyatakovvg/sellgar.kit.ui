import React from 'react';

import { Floating } from '../../../../../systems/floating';
import { SelectInput } from '../../../../../systems/floating/internals/select-input';
import { Placeholder } from '../../../multi-select/placeholder';
import { Surface } from '../../../multi-select/surface';

import { OptionList } from './option-list';
import { SelectedValueList } from './selected-value-list';
import { useTree } from '../../../../../systems/tree';
import {
  findSelectedTreeEntries,
  getSelectableTreeLeaves,
  getTreeSelectionStates,
  toggleTreeValues,
} from '../../../../../systems/tree-selection';

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
  resolveChildren(option: TOption): readonly TOption[] | undefined;
  placeholder?: string;
  clearable?: boolean;
  defaultExpanded?: boolean;
  selectAllEnabled?: boolean;
  selectAllText?: string;
  maxVisibleOptions?: number;
  mobileHeader?: React.ReactNode;
  resolveValue(option: TOption): string | number;
  isOptionDisabled?(option: TOption): boolean;
  renderOption?: React.ComponentProps<typeof OptionList<TOption>>['renderOption'];
  renderSelectedOption?: React.ComponentProps<typeof SelectedValueList<TOption>>['renderSelectedOption'];
  renderOverflow?: React.ComponentProps<typeof SelectedValueList<TOption>>['renderOverflow'];
  renderTrigger?(state: { open: boolean; disabled: boolean; selectedOptions: readonly TOption[] }): React.ReactElement;
}

interface IOptionProps<TOption> {
  resolveKey?: undefined;
  value?: NoInfer<readonly TOption[]>;
  isValueEqual?(left: NoInfer<TOption>, right: NoInfer<TOption>): boolean;
  onChange?(value: NoInfer<TOption[]>): void;
}

interface IResultProps<TOption, TResult> {
  resolveKey(option: TOption): TResult;
  value?: NoInfer<readonly TResult[]>;
  isValueEqual?(left: NoInfer<TResult>, right: NoInfer<TResult>): boolean;
  onChange?(value: TResult[]): void;
}

type IProps<TOption, TResult = TOption> = IBaseProps<TOption> &
  (IOptionProps<TOption> | IResultProps<TOption, TResult>);

interface IComponent {
  <TOption, TResult>(props: IBaseProps<TOption> & IResultProps<TOption, TResult>): React.ReactElement;
  <TOption>(props: IBaseProps<TOption> & IOptionProps<TOption>): React.ReactElement;
}

const resolveOption = <TOption,>(option: TOption): TOption => option;

const removeValue = <TValue,>(
  values: readonly TValue[] = [],
  value: TValue,
  isValueEqual: (left: TValue, right: TValue) => boolean = Object.is,
) => values.filter((selected) => !isValueEqual(selected, value));

const mapInputProps = <TOption, TResult>({
  options: _options,
  resolveChildren: _resolveChildren,
  resolveKey: _resolveKey,
  resolveValue: _resolveValue,
  isValueEqual: _isValueEqual,
  isOptionDisabled: _isOptionDisabled,
  renderOption: _renderOption,
  renderSelectedOption: _renderSelectedOption,
  renderOverflow: _renderOverflow,
  renderTrigger: _renderTrigger,
  mobileHeader: _mobileHeader,
  value: _value,
  onChange: _onChange,
  ...props
}: Omit<
  IProps<TOption, TResult>,
  | 'placeholder'
  | 'clearable'
  | 'selectAllEnabled'
  | 'selectAllText'
  | 'maxVisibleOptions'
  | 'fixHeight'
  | 'defaultExpanded'
>) => props;

export const MultipleTreeSelect: IComponent = <TOption, TResult = TOption>({
  placeholder = 'Выберите значения',
  clearable = true,
  defaultExpanded = true,
  selectAllEnabled = true,
  selectAllText = 'Выбрать все',
  maxVisibleOptions = 3,
  fixHeight = false,
  ...props
}: IProps<TOption, TResult>): React.ReactElement => {
  const [open, setOpen] = React.useState(false);
  const tree = useTree(props.options, props.resolveChildren, defaultExpanded, props.isOptionDisabled);
  const [selectAllActive, setSelectAllActive] = React.useState(false);
  const options = tree.entries.filter((entry) => entry.childrenIds.length === 0);
  const selectedOptions =
    props.resolveKey === void 0
      ? findSelectedTreeEntries(tree.entries, props.value, resolveOption, props.isValueEqual)
      : findSelectedTreeEntries(tree.entries, props.value, props.resolveKey, props.isValueEqual);
  const selectableOptions = getSelectableTreeLeaves(tree.entries);
  const selectedIds = new Set(selectedOptions.map((entry) => entry.id));
  const selectedSelectableCount = selectableOptions.filter((entry) => selectedIds.has(entry.id)).length;
  const isAllSelected = selectableOptions.length > 0 && selectedSelectableCount === selectableOptions.length;
  const isPartiallySelected = selectedSelectableCount > 0 && !isAllSelected;
  const branchStates = getTreeSelectionStates(tree.entries, selectedIds);
  const optionItems = tree.visibleEntries.map((entry) => ({ ...entry, kind: 'option' as const }));
  const items =
    selectAllEnabled && options.length > 0
      ? [{ id: 'select-all', kind: 'select-all' as const }, ...optionItems]
      : optionItems;
  const checkedIds = tree.entries
    .filter((entry) => {
      const state = branchStates.get(entry.id);
      return selectedIds.has(entry.id) || (state !== void 0 && state.total > 0 && state.selected === state.total);
    })
    .map((entry) => entry.id);
  const selectedListValues = isAllSelected ? ['select-all', ...checkedIds] : checkedIds;
  const hasSelectAll = selectAllEnabled && options.length > 0;
  const activeIndex =
    selectAllActive && hasSelectAll ? 0 : tree.activeIndex === null ? null : tree.activeIndex + (hasSelectAll ? 1 : 0);
  const inputProps = mapInputProps(props);
  const handleNavigate = (index: number | null): void => {
    setSelectAllActive(hasSelectAll && index === 0);
    tree.handleNavigate(index === null || (hasSelectAll && index === 0) ? null : index - (hasSelectAll ? 1 : 0));
  };
  const handleToggle = (id: string): void => {
    setSelectAllActive(false);
    tree.toggle(id);
  };
  const handleBranchSelect = (id: string): void => {
    const leaves = getSelectableTreeLeaves(tree.entries, id);
    if (props.disabled || leaves.length === 0) return;
    setSelectAllActive(false);
    tree.activate(id);
    if (props.resolveKey === void 0)
      props.onChange?.(
        toggleTreeValues(
          props.value,
          leaves.map((entry) => entry.option),
          props.isValueEqual,
        ),
      );
    else {
      const resolveKey = props.resolveKey;
      props.onChange?.(
        toggleTreeValues(
          props.value,
          leaves.map((entry) => resolveKey(entry.option)),
          props.isValueEqual,
        ),
      );
    }
  };

  React.useEffect(() => {
    if (props.disabled) {
      setOpen(false);
    }
  }, [props.disabled]);

  const handleRemove = (option: TOption): void => {
    if (props.disabled) return;

    if (props.resolveKey === void 0) {
      props.onChange?.(removeValue(props.value, option, props.isValueEqual));
    } else {
      props.onChange?.(removeValue(props.value, props.resolveKey(option), props.isValueEqual));
    }
  };

  const handleSelectAll = (): void => {
    if (props.disabled || selectableOptions.length === 0) return;
    setSelectAllActive(true);
    tree.handleNavigate(null);

    if (props.resolveKey === void 0) {
      props.onChange?.(isAllSelected ? [] : selectableOptions.map((entry) => entry.option));
    } else {
      const resolveKey = props.resolveKey;
      props.onChange?.(isAllSelected ? [] : selectableOptions.map((entry) => resolveKey(entry.option)));
    }
  };

  const handleClear = (): void => {
    if (!props.disabled && props.value?.length) props.onChange?.([]);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>): void => {
    props.onKeyDown?.(event);
    if (event.defaultPrevented || !clearable || props.disabled || event.target !== event.currentTarget) return;

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
        activeIndex={activeIndex}
        loop={false}
        role={'tree'}
        onNavigate={handleNavigate}
        onKeyDown={(event) => {
          if (!selectAllActive) tree.handleKeyDown(event);
        }}
        closeOnSelect={false}
        disabled={props.disabled}
        getItemDisabled={(item) =>
          item.kind === 'select-all' ? selectableOptions.length === 0 : item.disabled && item.childrenIds.length === 0
        }
        getItemValue={(item) => item.id}
        items={items}
        scrollItemIntoView={{ block: 'center', inline: 'nearest' }}
        selectionMode={'multiple'}
        value={selectedListValues}
        onItemSelect={({ item }) => {
          if (item.kind === 'select-all') handleSelectAll();
          else handleBranchSelect(item.id);
        }}
      >
        {(list) => (
          <div className={s.wrapper}>
            <Floating.Trigger role={'combobox'}>
              {props.renderTrigger ? (
                props.renderTrigger({
                  open: open && !props.disabled,
                  disabled: props.disabled === true,
                  selectedOptions: selectedOptions.map((entry) => entry.option),
                })
              ) : (
                <SelectInput
                  {...inputProps}
                  aria-expanded={open && !props.disabled}
                  aria-haspopup={'tree'}
                  fixHeight={fixHeight}
                  isClearable={clearable && Boolean(props.value?.length)}
                  isFocused={open && !props.disabled}
                  isOpen={open && !props.disabled}
                  onClear={handleClear}
                  onKeyDown={handleKeyDown}
                >
                  {selectedOptions.length > 0 ? (
                    <SelectedValueList
                      disabled={props.disabled === true}
                      maxVisibleOptions={maxVisibleOptions}
                      options={selectedOptions}
                      renderOverflow={props.renderOverflow}
                      renderSelectedOption={props.renderSelectedOption}
                      resolveValue={props.resolveValue}
                      onRemove={handleRemove}
                    />
                  ) : (
                    <Placeholder title={placeholder} />
                  )}
                </SelectInput>
              )}
            </Floating.Trigger>
            <Floating.Content matchReferenceWidth={true} minWidth={240}>
              {(content) => (
                <Surface
                  actionLabel={'Применить'}
                  listProps={list.getListProps(content.getContentProps())}
                  placeholder={props.mobileHeader === void 0 ? placeholder : props.mobileHeader}
                  presentation={content.presentation}
                  props={{ ref: content.ref, style: { ...content.floatingStyles, ...content.transitionStyles } }}
                  onClose={() => setOpen(false)}
                >
                  <OptionList
                    onCheck={(id) => {
                      if (id === 'select-all') handleSelectAll();
                      else handleBranchSelect(id);
                    }}
                    branchStates={branchStates}
                    expandedIds={tree.expandedIds}
                    onToggle={handleToggle}
                    isPartiallySelected={isPartiallySelected}
                    items={list.items}
                    optionsCount={options.length}
                    renderOption={props.renderOption}
                    resolveValue={props.resolveValue}
                    selectAllEnabled={selectAllEnabled}
                    selectAllText={selectAllText}
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
