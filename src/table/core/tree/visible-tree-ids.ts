import type { TableNodeModel } from '../column';

export type TreeNode = Pick<TableNodeModel<unknown>, 'nodeId' | 'depth' | 'hasChildren'>;

export const visibleTreeIds = (
  nodes: readonly TreeNode[],
  toggled: ReadonlySet<string>,
  defaultExpanded: boolean,
): string[] => {
  const ids: string[] = [];
  let collapsedDepth = Infinity;
  for (const node of nodes) {
    if (node.depth > collapsedDepth) continue;
    ids.push(node.nodeId);
    collapsedDepth = node.hasChildren && defaultExpanded === toggled.has(node.nodeId) ? node.depth : Infinity;
  }
  return ids;
};
