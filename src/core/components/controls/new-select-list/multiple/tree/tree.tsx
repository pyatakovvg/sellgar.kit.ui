import React from 'react';

import { Typography } from '../../../../content/typography';
import { Scrollbar } from '../../../../layout/scrollbar';
import { useTree } from '../../../../../systems/tree';
import type { ITreeEntry } from '../../../../../systems/tree';
import {
  findSelectedTreeEntries,
  getSelectableTreeLeaves,
  getTreeSelectionStates,
  toggleTreeValues,
} from '../../../../../systems/tree-selection';

import { useTreeFocus } from './hooks/use-tree-focus.hook';
import { TreeNode } from './tree-node';

import s from './default.module.scss';

interface IBaseProps<TOption> extends Omit<
  React.ComponentProps<'div'>,
  'children' | 'className' | 'style' | 'defaultValue' | 'onChange' | 'role' | 'dangerouslySetInnerHTML'
> {
  options: readonly TOption[];
  resolveChildren(option: TOption): readonly TOption[] | undefined;
  resolveValue(option: TOption): string | number;
  isOptionDisabled?(option: TOption): boolean;
  disabled?: boolean;
  defaultExpanded?: boolean;
  emptyText?: string;
  renderOption?(
    option: TOption,
    state: {
      depth: number;
      isActive: boolean;
      isDisabled: boolean;
      isSelected: boolean;
      isBranch: boolean;
      isExpanded: boolean;
      isIndeterminate: boolean;
      availableCount: number;
      onCheck(): void;
      onToggle(): void;
    },
  ): React.ReactNode;
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

const mapRootProps = <TOption, TResult>({
  options: _options,
  resolveChildren: _resolveChildren,
  resolveKey: _resolveKey,
  resolveValue: _resolveValue,
  isOptionDisabled: _isOptionDisabled,
  isValueEqual: _isValueEqual,
  value: _value,
  onChange: _onChange,
  renderOption: _renderOption,
  ...props
}: Omit<IProps<TOption, TResult>, 'disabled' | 'defaultExpanded' | 'emptyText'>) => props;

export const MultipleTreeSelectList: IComponent = <TOption, TResult = TOption>({
  disabled = false,
  defaultExpanded = true,
  emptyText = 'Нет данных',
  ...props
}: IProps<TOption, TResult>): React.ReactElement => {
  const tree = useTree(props.options, props.resolveChildren, defaultExpanded, props.isOptionDisabled);
  const selectedEntries =
    props.resolveKey === void 0
      ? findSelectedTreeEntries(tree.entries, props.value, resolveOption, props.isValueEqual)
      : findSelectedTreeEntries(tree.entries, props.value, props.resolveKey, props.isValueEqual);
  const selectedIds = new Set(selectedEntries.map((entry) => entry.id));
  const states = getTreeSelectionStates(tree.entries, selectedIds);
  const focus = useTreeFocus(tree, selectedIds, disabled);
  const treeId = React.useId();

  const handleCheck = (id: string): void => {
    if (disabled) return;
    const leaves = getSelectableTreeLeaves(tree.entries, id);
    if (leaves.length === 0) return;
    focus.focus(id);
    if (props.resolveKey === void 0) {
      props.onChange?.(
        toggleTreeValues(
          props.value,
          leaves.map((entry) => entry.option),
          props.isValueEqual,
        ),
      );
    } else {
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

  const mapNode = (entry: ITreeEntry<TOption>): React.ComponentProps<typeof TreeNode>['node'] => {
    const branch = entry.childrenIds.length > 0;
    const expanded = tree.expandedIds.has(entry.id);
    const state = states.get(entry.id);
    const checked =
      selectedIds.has(entry.id) || (state !== void 0 && state.total > 0 && state.selected === state.total);
    const indeterminate = state !== void 0 && state.selected > 0 && state.selected < state.total;
    const selectionDisabled = disabled || entry.disabled || state?.total === 0;
    const id = `${treeId}-${entry.id}`;
    const onCheck = (): void => handleCheck(entry.id);
    const onToggle = (): void => {
      if (disabled) return;
      focus.focus(entry.id);
      tree.toggle(entry.id);
    };
    return {
      id,
      label: props.resolveValue(entry.option),
      branch,
      expanded,
      checked,
      indeterminate,
      disabled: selectionDisabled,
      toggleDisabled: disabled,
      count: state?.total ?? 0,
      children: expanded
        ? entry.childrenIds.flatMap((childId) => {
            const child = tree.entriesById.get(childId);
            return child === void 0 ? [] : [mapNode(child)];
          })
        : [],
      custom: props.renderOption !== void 0,
      content: props.renderOption?.(entry.option, {
        depth: entry.depth,
        isActive: tree.activeIndex !== null && tree.visibleEntries[tree.activeIndex]?.id === entry.id,
        isDisabled: selectionDisabled,
        isSelected: checked,
        isBranch: branch,
        isExpanded: expanded,
        isIndeterminate: indeterminate,
        availableCount: state?.total ?? 0,
        onCheck,
        onToggle,
      }),
      onCheck,
      onToggle,
      onFocus: () => focus.focus(entry.id),
      elementProps: {
        id,
        ref: (element) => focus.register(entry.id, element),
        role: 'treeitem',
        'aria-label': String(props.resolveValue(entry.option)),
        'aria-level': entry.depth + 1,
        'aria-posinset': entry.position,
        'aria-setsize': entry.siblingsCount,
        'aria-expanded': branch ? expanded : void 0,
        'aria-owns': branch && expanded ? `${id}-group` : void 0,
        'aria-checked': indeterminate ? 'mixed' : checked,
        'aria-disabled': disabled || (!branch && selectionDisabled),
        tabIndex: focus.tabStopId === entry.id ? 0 : -1,
        onFocus: (event) => {
          if (event.target === event.currentTarget && !disabled) tree.activate(entry.id);
        },
        onClick: onCheck,
        onKeyDown: (event) => {
          if (event.defaultPrevented || event.target !== event.currentTarget || disabled) return;
          if (event.key === ' ' || event.key === 'Enter') {
            event.preventDefault();
            onCheck();
          } else focus.handleKeyDown(event, entry.id);
        },
      },
    };
  };

  return (
    <div
      {...mapRootProps(props)}
      aria-disabled={disabled}
      aria-multiselectable={true}
      className={s.wrapper}
      role={'tree'}
      onFocusCapture={(event) => {
        props.onFocusCapture?.(event);
        focus.handleFocusCapture(event);
      }}
      onBlurCapture={(event) => {
        props.onBlurCapture?.(event);
        focus.handleBlurCapture(event);
      }}
    >
      <Scrollbar className={s.scrollbar}>
        <div className={s.content}>
          {tree.entries.length === 0 ? (
            <Typography size={'caption-l'} weight={'medium'}>
              <p className={s.empty}>{emptyText}</p>
            </Typography>
          ) : (
            tree.entries
              .filter((entry) => entry.parentId === void 0)
              .map((entry) => <TreeNode key={entry.id} node={mapNode(entry)} />)
          )}
        </div>
      </Scrollbar>
    </div>
  );
};
