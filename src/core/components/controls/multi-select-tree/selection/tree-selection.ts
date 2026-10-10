import type { TreeOption } from '../../../../../shared/utils/tree-options/tree-options.mapper';

export const normalizeTreeSelection = <T>(options: readonly TreeOption<T>[], values: readonly (string | number)[]) => {
  const nodes = new Map(options.map((option) => [option.key, option]));
  const selected = new Set<string | number>();
  const selectBranch = (key: string | number) => {
    const node = nodes.get(key);
    if (!node || selected.has(key)) return;
    selected.add(key);
    node.childrenKeys.forEach(selectBranch);
  };
  values.forEach(selectBranch);

  for (let index = options.length - 1; index >= 0; index--) {
    const node = options[index];
    if (node.childrenKeys.length > 0 && node.childrenKeys.every((key) => selected.has(key))) {
      selected.add(node.key);
    }
  }

  return options.filter((node) => selected.has(node.key)).map((node) => node.key);
};

export const changeTreeSelection = <T>(
  options: readonly TreeOption<T>[],
  previousValues: readonly (string | number)[],
  nextValues: readonly (string | number)[],
) => {
  const next = new Set(nextValues);
  const removed = previousValues.filter((key) => !next.has(key));
  if (removed.length === 0) return normalizeTreeSelection(options, nextValues);

  const nodes = new Map(options.map((option) => [option.key, option]));
  const clearBranch = (key: string | number) => {
    next.delete(key);
    nodes.get(key)?.childrenKeys.forEach(clearBranch);
  };
  for (const key of removed) {
    clearBranch(key);
    let parentKey = nodes.get(key)?.parentKey;
    while (parentKey !== undefined) {
      next.delete(parentKey);
      parentKey = nodes.get(parentKey)?.parentKey;
    }
  }
  return normalizeTreeSelection(options, [...next]);
};

export const getPartialTreeSelection = <T>(
  options: readonly TreeOption<T>[],
  selectedValues: ReadonlySet<string | number>,
) => {
  const partial = new Set<string | number>();
  for (let index = options.length - 1; index >= 0; index--) {
    const node = options[index];
    if (selectedValues.has(node.key)) continue;
    if (node.childrenKeys.some((key) => selectedValues.has(key) || partial.has(key))) {
      partial.add(node.key);
    }
  }
  return partial;
};
