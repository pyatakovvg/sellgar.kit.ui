import type { TableNodeModel } from './column.ts';

export interface SelectionModel {
  readonly type: 'include' | 'exclude';
  readonly nodeIds: ReadonlySet<string>;
}

export interface SelectionStatus {
  readonly selected: boolean;
  readonly indeterminate: boolean;
}

export interface SelectionIndex {
  readonly nodes: readonly Pick<TableNodeModel<unknown>, 'nodeId' | 'parentNodeId' | 'depth'>[];
  readonly positions: ReadonlyMap<string, number>;
  readonly subtreeEnds: readonly number[];
}

export const createEmptySelection = (): SelectionModel => ({ type: 'include', nodeIds: new Set() });

export const isNodeSelected = (model: SelectionModel, id: string): boolean =>
  model.type === 'include' ? model.nodeIds.has(id) : !model.nodeIds.has(id);

export const createSelectionIndex = (nodes: SelectionIndex['nodes']): SelectionIndex => {
  const positions = new Map<string, number>();
  const subtreeEnds = nodes.map(() => nodes.length);
  const stack: number[] = [];

  for (let index = 0; index < nodes.length; index++) {
    while (stack.length && nodes[stack[stack.length - 1]].depth >= nodes[index].depth) {
      subtreeEnds[stack.pop()!] = index;
    }
    positions.set(nodes[index].nodeId, index);
    stack.push(index);
  }

  return { nodes, positions, subtreeEnds };
};

export const retainSelection = (model: SelectionModel, index: SelectionIndex): SelectionModel => {
  const nodeIds = new Set<string>();
  for (const id of model.nodeIds) if (index.positions.has(id)) nodeIds.add(id);
  return nodeIds.size === model.nodeIds.size ? model : { type: model.type, nodeIds };
};

/** Computes subtree states in one reverse preorder pass. */
export const getSelectionStatuses = (model: SelectionModel, index: SelectionIndex): Map<string, SelectionStatus> => {
  const counts = index.nodes.map(() => 0);
  const statuses = new Map<string, SelectionStatus>();

  for (let position = index.nodes.length - 1; position >= 0; position--) {
    const node = index.nodes[position];
    const selectedCount = counts[position] + Number(isNodeSelected(model, node.nodeId));
    const totalCount = index.subtreeEnds[position] - position;
    statuses.set(node.nodeId, {
      selected: selectedCount === totalCount,
      indeterminate: selectedCount > 0 && selectedCount < totalCount,
    });
    const parent = node.parentNodeId === null ? undefined : index.positions.get(node.parentNodeId);
    if (parent !== undefined) counts[parent] += selectedCount;
  }

  return statuses;
};

export const toggleSelection = (
  model: SelectionModel,
  index: SelectionIndex,
  id: string,
  tree: boolean,
): SelectionModel => {
  const start = index.positions.get(id);
  if (start === undefined) return model;
  const end = tree ? index.subtreeEnds[start] : start + 1;
  let allSelected = true;
  for (let position = start; position < end; position++) {
    if (!isNodeSelected(model, index.nodes[position].nodeId)) allSelected = false;
  }
  return setSubtreeSelection(model, index, start, end, !allSelected, tree);
};

export const clearPartialSelection = (model: SelectionModel, index: SelectionIndex, id: string): SelectionModel => {
  const start = index.positions.get(id);
  if (start === undefined || !getSelectionStatuses(model, index).get(id)?.indeterminate) return model;
  return setSubtreeSelection(model, index, start, index.subtreeEnds[start], false, true);
};

export const toggleAllSelection = (model: SelectionModel, index: SelectionIndex): SelectionModel => {
  if (!index.nodes.length) return model;
  if (index.nodes.every((node) => isNodeSelected(model, node.nodeId))) return createEmptySelection();
  return { type: 'exclude', nodeIds: new Set() };
};

const setMembership = (nodeIds: Set<string>, type: SelectionModel['type'], id: string, selected: boolean): void => {
  if (selected === (type === 'include')) nodeIds.add(id);
  else nodeIds.delete(id);
};

const setSubtreeSelection = (
  model: SelectionModel,
  index: SelectionIndex,
  start: number,
  end: number,
  selected: boolean,
  tree: boolean,
): SelectionModel => {
  const nodeIds = new Set(model.nodeIds);
  const next: SelectionModel = { type: model.type, nodeIds };
  for (let position = start; position < end; position++) {
    setMembership(nodeIds, model.type, index.nodes[position].nodeId, selected);
  }
  if (!tree) return next;

  const ancestors = new Set<string>();
  let parentId = index.nodes[start].parentNodeId;
  while (parentId !== null) {
    ancestors.add(parentId);
    parentId = index.nodes[index.positions.get(parentId)!].parentNodeId;
  }
  const counts = index.nodes.map(() => 0);
  for (let position = index.nodes.length - 1; position >= 0; position--) {
    const node = index.nodes[position];
    if (ancestors.has(node.nodeId)) {
      const allDescendantsSelected = counts[position] === index.subtreeEnds[position] - position - 1;
      setMembership(nodeIds, model.type, node.nodeId, allDescendantsSelected);
    }
    const count = counts[position] + Number(isNodeSelected(next, node.nodeId));
    const parent = node.parentNodeId === null ? undefined : index.positions.get(node.parentNodeId);
    if (parent !== undefined) counts[parent] += count;
  }
  return next;
};
