import type { ITreeEntry } from '../tree';

export const findSelectedTreeEntries = <TOption, TValue>(
  entries: readonly ITreeEntry<TOption>[],
  value: readonly TValue[] = [],
  resolveKey: (option: TOption) => TValue,
  isValueEqual: (left: TValue, right: TValue) => boolean = Object.is,
) =>
  entries.filter(
    (entry) =>
      entry.childrenIds.length === 0 && value.some((selected) => isValueEqual(selected, resolveKey(entry.option))),
  );

export const getSelectableTreeLeaves = <TOption>(entries: readonly ITreeEntry<TOption>[], branchId?: string) =>
  entries.filter(
    (entry) =>
      !entry.disabled &&
      entry.childrenIds.length === 0 &&
      (branchId === void 0 || entry.id === branchId || entry.ancestorIds.includes(branchId)),
  );

export const getTreeSelectionStates = <TOption>(
  entries: readonly ITreeEntry<TOption>[],
  selectedIds: ReadonlySet<string>,
) => {
  const states = new Map(entries.map((entry) => [entry.id, { total: 0, selected: 0 }]));
  for (let index = entries.length - 1; index >= 0; index--) {
    const entry = entries[index];
    if (entry === void 0) continue;
    const state = states.get(entry.id);
    if (state === void 0) continue;
    if (entry.childrenIds.length === 0 && !entry.disabled) {
      state.total = 1;
      state.selected = selectedIds.has(entry.id) ? 1 : 0;
    }
    const parent = entry.parentId === void 0 ? void 0 : states.get(entry.parentId);
    if (parent !== void 0) {
      parent.total += state.total;
      parent.selected += state.selected;
    }
  }
  return states;
};

export const toggleTreeValues = <TValue>(
  values: readonly TValue[] = [],
  targets: readonly TValue[],
  isValueEqual: (left: TValue, right: TValue) => boolean = Object.is,
): TValue[] => {
  const isAllSelected = targets.every((target) => values.some((value) => isValueEqual(value, target)));
  if (isAllSelected) return values.filter((value) => !targets.some((target) => isValueEqual(value, target)));
  const next = [...values];
  for (const target of targets) {
    if (!next.some((value) => isValueEqual(value, target))) next.push(target);
  }
  return next;
};
