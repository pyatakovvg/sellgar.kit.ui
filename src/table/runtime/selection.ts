import {
  clearPartialSelection,
  createEmptySelection,
  createSelectionIndex,
  getSelectionStatuses,
  isNodeSelected,
  retainSelection,
  toggleAllSelection,
  toggleSelection,
} from '../core/selection.ts';

import type { SelectionModel, SelectionStatus } from '../core/selection.ts';
import type { TableNodeModel } from '../core/column.ts';

export interface SelectionSnapshot<T extends object = object> {
  readonly ready: boolean;
  readonly enabled: boolean;
  readonly rows: readonly T[];
  readonly selectedCount: number;
  readonly allSelected: boolean;
  readonly indeterminate: boolean;
  readonly canClear: boolean;
  readonly canSelectAll: boolean;
}

export const EMPTY_SELECTION_SNAPSHOT: SelectionSnapshot = {
  ready: false,
  enabled: false,
  rows: [],
  selectedCount: 0,
  allSelected: false,
  indeterminate: false,
  canClear: false,
  canSelectAll: false,
};

const EMPTY_STATUS: SelectionStatus = { selected: false, indeterminate: false };

/** Instance state; scroll and geometry changes never enter this store. */
export class SelectionRuntime<T extends object = object> {
  private nodes: readonly TableNodeModel<T>[] = [];
  private index = createSelectionIndex([]);
  private tree = false;
  private model: SelectionModel = createEmptySelection();
  private statuses: ReadonlyMap<string, SelectionStatus> = new Map();
  private snapshot: SelectionSnapshot<T> = EMPTY_SELECTION_SNAPSHOT as SelectionSnapshot<T>;
  private readonly listeners = new Set<() => void>();

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  getSnapshot = (): SelectionSnapshot<T> => this.snapshot;

  getRowStatus = (id: string): SelectionStatus => this.statuses.get(id) ?? EMPTY_STATUS;

  configure(nodes: readonly TableNodeModel<T>[], enabled: boolean, tree: boolean): void {
    const unchanged =
      nodes.length === this.nodes.length &&
      nodes.every((node, position) => {
        const previous = this.nodes[position];
        return (
          node.nodeId === previous.nodeId &&
          node.data === previous.data &&
          node.parentNodeId === previous.parentNodeId &&
          node.depth === previous.depth
        );
      });
    if (this.snapshot.ready && unchanged && enabled === this.snapshot.enabled && tree === this.tree) return;
    this.nodes = nodes;
    this.index = createSelectionIndex(nodes);
    this.tree = tree;
    this.model = enabled ? retainSelection(this.model, this.index) : createEmptySelection();
    this.publish(enabled);
  }

  toggle = (id: string): void => {
    if (this.snapshot.enabled) this.install(toggleSelection(this.model, this.index, id, this.tree));
  };

  clear = (): void => {
    if (this.snapshot.enabled) this.install(createEmptySelection());
  };

  selectAll = (): void => {
    if (this.snapshot.enabled && !this.snapshot.allSelected && this.nodes.length) {
      this.install(toggleAllSelection(createEmptySelection(), this.index));
    }
  };

  toggleAll = (): void => {
    if (this.snapshot.enabled) this.install(toggleAllSelection(this.model, this.index));
  };

  clearPartialSubtree = (id: string): void => {
    if (this.snapshot.enabled && this.tree) this.install(clearPartialSelection(this.model, this.index, id));
  };

  private install(model: SelectionModel): void {
    if (model === this.model) return;
    if (
      model.type === this.model.type &&
      model.nodeIds.size === this.model.nodeIds.size &&
      [...model.nodeIds].every((id) => this.model.nodeIds.has(id))
    )
      return;
    this.model = model;
    this.publish(this.snapshot.enabled);
  }

  private publish(enabled: boolean): void {
    const rows: T[] = [];
    const statuses =
      enabled && this.tree ? getSelectionStatuses(this.model, this.index) : new Map<string, SelectionStatus>();
    for (const node of this.nodes) {
      const selected = enabled && isNodeSelected(this.model, node.nodeId);
      if (selected) rows.push(node.data);
      if (enabled && !this.tree) {
        statuses.set(node.nodeId, { selected, indeterminate: false });
      }
    }
    for (const [id, status] of statuses) {
      const previous = this.statuses.get(id);
      if (previous?.selected === status.selected && previous.indeterminate === status.indeterminate) {
        statuses.set(id, previous);
      }
    }
    this.statuses = statuses;
    const previousRows = this.snapshot.rows;
    const sameRows =
      rows.length === previousRows.length && rows.every((row, position) => row === previousRows[position]);
    const allSelected = rows.length > 0 && rows.length === this.nodes.length;
    this.snapshot = {
      ready: true,
      enabled,
      rows: sameRows ? previousRows : rows,
      selectedCount: rows.length,
      allSelected,
      indeterminate: rows.length > 0 && !allSelected,
      canClear: enabled && rows.length > 0,
      canSelectAll: enabled && !allSelected && this.nodes.length > 0,
    };
    for (const listener of this.listeners) listener();
  }
}
