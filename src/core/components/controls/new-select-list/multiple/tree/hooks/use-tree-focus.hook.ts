import React from 'react';

import type { useTree } from '../../../../../../systems/tree';

export const useTreeFocus = <TOption>(
  tree: ReturnType<typeof useTree<TOption>>,
  selectedIds: ReadonlySet<string>,
  disabled: boolean,
) => {
  const elements = React.useRef(new Map<string, HTMLDivElement>());
  const pendingFocusId = React.useRef<string>(void 0);
  const focusOwner = React.useRef<{
    root: HTMLDivElement;
    target: HTMLElement;
    id: string | undefined;
  }>(void 0);
  const navigableEntries = tree.visibleEntries.filter((entry) => !entry.disabled || entry.childrenIds.length > 0);
  const activeEntry = tree.activeIndex === null ? void 0 : tree.visibleEntries[tree.activeIndex];
  const previous = React.useRef({ entriesById: tree.entriesById, navigableEntries, activeEntry });
  const navigableIds = new Set(navigableEntries.map((entry) => entry.id));

  const findFallback = (id: string | undefined): string | undefined => {
    if (id === void 0) return;
    const entry = tree.entriesById.get(id) ?? previous.current.entriesById.get(id);
    if (entry !== void 0) {
      for (let index = entry.ancestorIds.length - 1; index >= 0; index--) {
        const ancestorId = entry.ancestorIds[index];
        if (ancestorId !== void 0 && navigableIds.has(ancestorId)) return ancestorId;
      }
    }

    const previousEntries = previous.current.navigableEntries;
    const previousIndex = previousEntries.findIndex((entry) => entry.id === id);
    for (let distance = 1; distance < previousEntries.length; distance++) {
      const next = previousEntries[previousIndex + distance];
      if (next !== void 0 && navigableIds.has(next.id)) return next.id;
      const preceding = previousEntries[previousIndex - distance];
      if (preceding !== void 0 && navigableIds.has(preceding.id)) return preceding.id;
    }
    return navigableEntries[Math.max(0, Math.min(previousIndex, navigableEntries.length - 1))]?.id;
  };

  const activeId = activeEntry !== void 0 && navigableIds.has(activeEntry.id) ? activeEntry.id : void 0;
  const fallbackId = activeId ?? findFallback(previous.current.activeEntry?.id);
  const tabStopId = disabled
    ? void 0
    : (fallbackId ?? navigableEntries.find((entry) => selectedIds.has(entry.id))?.id ?? navigableEntries[0]?.id);

  React.useLayoutEffect(() => {
    const owner = focusOwner.current;
    const document = owner?.root.ownerDocument;
    const focusedElement = document?.activeElement;
    const ownsFocus =
      owner !== void 0 &&
      (owner.root.contains(focusedElement ?? null) ||
        (!owner.target.isConnected && (focusedElement === document?.body || focusedElement === null)));
    const needsRecovery = ownsFocus && owner.id !== void 0 && !navigableIds.has(owner.id);
    const nextId = needsRecovery ? findFallback(owner.id) : fallbackId;
    const pendingId = pendingFocusId.current;
    pendingFocusId.current = void 0;

    if (nextId !== void 0 && nextId !== activeId) tree.activate(nextId);
    else if (nextId === void 0 && previous.current.activeEntry !== void 0) tree.handleNavigate(null);

    if (!ownsFocus || nextId === void 0 || (disabled && !owner.target.isConnected)) focusOwner.current = void 0;
    if (!disabled && ownsFocus) {
      const focusId = pendingId !== void 0 && navigableIds.has(pendingId) ? pendingId : needsRecovery ? nextId : void 0;
      if (focusId !== void 0) elements.current.get(focusId)?.focus({ preventScroll: true });
    }

    previous.current = {
      entriesById: tree.entriesById,
      navigableEntries,
      activeEntry: nextId === void 0 ? void 0 : tree.entriesById.get(nextId),
    };
  });

  const handleFocusCapture = (event: React.FocusEvent<HTMLDivElement>): void => {
    const entry = tree.visibleEntries.find((entry) => elements.current.get(entry.id)?.contains(event.target));
    focusOwner.current = { root: event.currentTarget, target: event.target, id: entry?.id };
  };

  const handleBlurCapture = (event: React.FocusEvent<HTMLDivElement>): void => {
    if (!(event.relatedTarget instanceof Node) || !event.currentTarget.contains(event.relatedTarget))
      focusOwner.current = void 0;
  };

  const focus = (id: string): void => {
    if (disabled) return;
    const entry = tree.entriesById.get(id);
    if (entry === void 0 || (entry.disabled && entry.childrenIds.length === 0)) return;
    tree.activate(id);
    elements.current.get(id)?.focus({ preventScroll: true });
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>, id: string): void => {
    if (disabled || event.defaultPrevented || event.target !== event.currentTarget) return;
    const index = navigableEntries.findIndex((entry) => entry.id === id);
    if (index < 0) return;
    let nextId: string | undefined;
    if (event.key === 'ArrowDown') nextId = navigableEntries[index + 1]?.id;
    else if (event.key === 'ArrowUp') nextId = navigableEntries[index - 1]?.id;
    else if (event.key === 'Home') nextId = navigableEntries[0]?.id;
    else if (event.key === 'End') nextId = navigableEntries.at(-1)?.id;
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      const entry = tree.entriesById.get(id);
      if (entry === void 0) return;
      if (event.key === 'ArrowRight' && tree.expandedIds.has(id)) {
        pendingFocusId.current = entry.childrenIds.find((childId) => {
          const child = tree.entriesById.get(childId);
          return child !== void 0 && (!child.disabled || child.childrenIds.length > 0);
        });
      } else if (event.key === 'ArrowLeft' && !tree.expandedIds.has(id)) {
        pendingFocusId.current = entry.parentId;
      }
      tree.handleKeyDown(event);
      return;
    } else return;
    event.preventDefault();
    if (nextId !== void 0) focus(nextId);
  };

  const register = (id: string, element: HTMLDivElement | null): void => {
    if (element === null) elements.current.delete(id);
    else elements.current.set(id, element);
  };

  return { tabStopId, register, focus, handleKeyDown, handleFocusCapture, handleBlurCapture };
};
