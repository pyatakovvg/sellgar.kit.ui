import type { TableNodeModel } from '../column';

export const flattenTree = <T extends object>(
  rows: readonly T[],
  getId: (row: T) => string,
  getChildren?: (row: T) => unknown,
): TableNodeModel<T>[] => {
  const result: TableNodeModel<T>[] = [];
  const ids = new Set<string>();
  const objects = new Set<object>();
  const pending = rows.map((data) => ({ data, depth: 0, parentNodeId: null as string | null })).reverse();

  while (pending.length) {
    const entry = pending.pop()!;
    if (!entry.data || typeof entry.data !== 'object') throw new TypeError('Table rows must be objects.');
    if (objects.has(entry.data)) throw new Error('Table rows must have unique objects; tree cycles are not allowed.');
    objects.add(entry.data);
    const nodeId = getId(entry.data);
    if (!nodeId || ids.has(nodeId)) throw new Error('Table rows must have unique, non-empty identities.');
    ids.add(nodeId);
    const children = getChildren?.(entry.data) ?? [];
    if (!Array.isArray(children)) throw new TypeError('Table tree children must be an array.');
    result.push({ ...entry, nodeId, index: result.length, hasChildren: children.length > 0 });
    for (let index = children.length - 1; index >= 0; index--) {
      pending.push({ data: children[index], depth: entry.depth + 1, parentNodeId: nodeId });
    }
  }
  return result;
};
