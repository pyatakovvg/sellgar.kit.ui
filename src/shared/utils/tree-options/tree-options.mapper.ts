export interface TreeOption<T> {
  key: string | number;
  label: string;
  depth: number;
  option: T;
  parentKey: string | number | undefined;
  childrenKeys: readonly (string | number)[];
}

export const mapTreeOptions = <
  T extends Record<K, string | number> & Partial<Record<A, readonly T[] | null>>,
  K extends keyof T,
  A extends keyof T,
>(
  options: readonly T[],
  optionKey: K,
  optionValue: keyof T,
  accessor: A,
  depth = 0,
  parentKey?: string | number,
): TreeOption<T>[] => {
  return options.flatMap((option) => {
    const children = option[accessor] ?? [];

    return [
      {
        key: option[optionKey],
        label: String(option[optionValue]),
        depth,
        option,
        parentKey,
        childrenKeys: children.map((child) => child[optionKey]),
      },
      ...mapTreeOptions(children, optionKey, optionValue, accessor, depth + 1, option[optionKey]),
    ];
  });
};
