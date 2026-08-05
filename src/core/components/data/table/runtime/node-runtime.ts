import { assertTableInvariant } from './invariant.ts';

import type { TableNodeId, TableNodeModel } from './types.ts';

const TABLE2_NODE_ID_PREFIX = 'table.node';

export interface TableNodeTreeOptions<T> {
  accessor: keyof T;
}

const getNodeChildren = <T extends object>(data: T, tree: TableNodeTreeOptions<T> | undefined): T[] => {
  if (!tree) return [];

  const record = data as Record<string, unknown>;
  const children = record[tree.accessor as string];

  return Array.isArray(children) ? (children as T[]) : [];
};

export class NodeRuntime<T extends object> {
  private _nextNodeId = 0;
  private _nodes: TableNodeModel<T>[] = [];
  private _nodeById = new Map<TableNodeId, TableNodeModel<T>>();
  private readonly _objectNodeIds = new WeakMap<object, TableNodeId>();

  setData(dataNodes: T[], tree?: TableNodeTreeOptions<T>): void {
    const nextNodes: TableNodeModel<T>[] = [];
    const nextNodeById = new Map<TableNodeId, TableNodeModel<T>>();

    const appendNodes = (nodes: T[], depth: number, parentNodeId: TableNodeId | null): void => {
      for (let index = 0; index < nodes.length; index++) {
        const data = nodes[index];
        const children = getNodeChildren(data, tree);
        const nodeId = this.getNodeId(data);
        const node: TableNodeModel<T> = {
          nodeId,
          data,
          index: nextNodes.length,
          depth,
          parentNodeId,
          hasChildren: children.length > 0,
        };

        assertTableInvariant(!nextNodeById.has(nodeId), `Table node id "${nodeId}" is duplicated.`);

        nextNodes.push(node);
        nextNodeById.set(nodeId, node);

        if (children.length > 0) {
          appendNodes(children, depth + 1, nodeId);
        }
      }
    };

    appendNodes(dataNodes, 0, null);

    this._nodes = nextNodes;
    this._nodeById = nextNodeById;
  }

  getNodes(): TableNodeModel<T>[] {
    return this._nodes;
  }

  getNode(nodeId: TableNodeId): TableNodeModel<T> | undefined {
    return this._nodeById.get(nodeId);
  }

  getSubtreeNodeIds(nodeId: TableNodeId): TableNodeId[] {
    const node = this.getNode(nodeId);

    if (!node) return [];

    const subtreeNodeIds: TableNodeId[] = [];

    for (let index = node.index; index < this._nodes.length; index++) {
      const currentNode = this._nodes[index];

      if (index > node.index && currentNode.depth <= node.depth) {
        break;
      }

      subtreeNodeIds.push(currentNode.nodeId);
    }

    return subtreeNodeIds;
  }

  getAncestorNodeIds(nodeId: TableNodeId): TableNodeId[] {
    const ancestorNodeIds: TableNodeId[] = [];
    let node = this.getNode(nodeId);

    while (node?.parentNodeId) {
      ancestorNodeIds.push(node.parentNodeId);
      node = this.getNode(node.parentNodeId);
    }

    return ancestorNodeIds;
  }

  private getNodeId(data: T): TableNodeId {
    const cachedNodeId = this._objectNodeIds.get(data);

    if (cachedNodeId) return cachedNodeId;

    this._nextNodeId += 1;

    const nodeId = `${TABLE2_NODE_ID_PREFIX}:${this._nextNodeId}`;

    this._objectNodeIds.set(data, nodeId);

    return nodeId;
  }
}
