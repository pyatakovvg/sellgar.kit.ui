import React from 'react';

export interface ITreeEntry<TOption> {
  id: string;
  option: TOption;
  parentId: string | undefined;
  ancestorIds: readonly string[];
  depth: number;
  position: number;
  siblingsCount: number;
  childrenIds: readonly string[];
  disabled: boolean;
}

export const useTree = <TOption>(
  options: readonly TOption[],
  resolveChildren: (option: TOption) => readonly TOption[] | undefined,
  defaultExpanded = true,
  isOptionDisabled?: (option: TOption) => boolean,
) => {
  const identitiesRef = React.useRef(new Map<TOption, number>());
  const nextIdentityRef = React.useRef(0);
  const [expansion, setExpansion] = React.useState<{ defaultExpanded: boolean; toggledIds: ReadonlySet<string> }>(
    () => ({
      defaultExpanded,
      toggledIds: new Set(),
    }),
  );
  const [activeId, setActiveId] = React.useState<string>();

  const entries = React.useMemo(() => {
    const identities = new Map<TOption, number>();
    const occurrences = new Map<TOption, number>();
    const entries: ITreeEntry<TOption>[] = [];

    const visit = (options: readonly TOption[], ancestorIds: readonly string[], disabled: boolean): string[] => {
      return options.map((option, index) => {
        let identity = identities.get(option) ?? identitiesRef.current.get(option);
        if (identity === void 0) identity = nextIdentityRef.current++;
        identities.set(option, identity);
        const occurrence = occurrences.get(option) ?? 0;
        occurrences.set(option, occurrence + 1);
        const id = `${identity}:${occurrence}`;
        const entry: ITreeEntry<TOption> = {
          id,
          option,
          parentId: ancestorIds.at(-1),
          ancestorIds,
          depth: ancestorIds.length,
          position: index + 1,
          siblingsCount: options.length,
          childrenIds: [],
          disabled: disabled || isOptionDisabled?.(option) === true,
        };
        entries.push(entry);
        const children = resolveChildren(option);
        if (children !== void 0 && children.length > 0)
          entry.childrenIds = visit(children, [...ancestorIds, id], entry.disabled);
        return id;
      });
    };

    visit(options, [], false);
    identitiesRef.current = identities;
    return entries;
  }, [isOptionDisabled, options, resolveChildren]);

  const entriesById = React.useMemo(() => new Map(entries.map((entry) => [entry.id, entry])), [entries]);
  const expandedIds = React.useMemo(
    () =>
      new Set(
        entries
          .filter(
            (entry) => entry.childrenIds.length > 0 && expansion.defaultExpanded !== expansion.toggledIds.has(entry.id),
          )
          .map((entry) => entry.id),
      ),
    [entries, expansion],
  );
  const visibleEntries = React.useMemo(() => {
    const visible: ITreeEntry<TOption>[] = [];
    const visibleIds = new Set<string>();
    for (const entry of entries) {
      if (entry.parentId !== void 0 && (!visibleIds.has(entry.parentId) || !expandedIds.has(entry.parentId))) continue;
      visible.push(entry);
      visibleIds.add(entry.id);
    }
    return visible;
  }, [entries, expandedIds]);
  const activeIndex = visibleEntries.findIndex((entry) => entry.id === activeId);

  const toggle = (id: string): void => {
    const entry = entriesById.get(id);
    if (entry === void 0 || entry.childrenIds.length === 0) return;
    setExpansion((previous) => {
      const next = new Set(previous.toggledIds);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { ...previous, toggledIds: next };
    });
    setActiveId(id);
  };

  const handleNavigate = (index: number | null): void => {
    setActiveId(index === null ? void 0 : visibleEntries[index]?.id);
  };

  const activate = (id: string): void => {
    const entry = entriesById.get(id);
    if (entry !== void 0 && (!entry.disabled || entry.childrenIds.length > 0)) setActiveId(id);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLElement>): void => {
    if (event.defaultPrevented || (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight')) return;
    const entry = visibleEntries[activeIndex];
    if (entry === void 0) return;
    event.preventDefault();
    if (event.key === 'ArrowRight') {
      if (entry.childrenIds.length === 0) return;
      if (!expandedIds.has(entry.id)) toggle(entry.id);
      else {
        const childId = entry.childrenIds.find((id) => {
          const child = entriesById.get(id);
          return child !== void 0 && (!child.disabled || child.childrenIds.length > 0);
        });
        if (childId !== void 0) setActiveId(childId);
      }
    } else if (entry.childrenIds.length > 0 && expandedIds.has(entry.id)) toggle(entry.id);
    else if (entry.parentId !== void 0) setActiveId(entry.parentId);
  };

  return {
    entries,
    entriesById,
    visibleEntries,
    expandedIds,
    activeIndex: activeIndex < 0 ? null : activeIndex,
    toggle,
    activate,
    handleNavigate,
    handleKeyDown,
  };
};
