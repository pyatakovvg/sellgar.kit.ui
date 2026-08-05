import type { TableNodeId, TableNodeModel } from './types.ts';

export interface TableTreeRuntimeOptions {
  enabled?: boolean;
  defaultExpanded?: boolean;
  toggledNodeIds?: ReadonlySet<TableNodeId>;
}

const isExpanded = (nodeId: TableNodeId, options: TableTreeRuntimeOptions): boolean => {
  const isToggled = options.toggledNodeIds?.has(nodeId) ?? false;

  return options.defaultExpanded ? !isToggled : isToggled;
};

export class TreeRuntime<T> {
  getVisibleNodes(nodes: TableNodeModel<T>[], options: TableTreeRuntimeOptions = {}): TableNodeModel<T>[] {
    if (!options.enabled) return nodes;

    const visibleNodes: TableNodeModel<T>[] = [];
    let collapsedDepth: number | null = null;

    for (const node of nodes) {
      if (collapsedDepth !== null) {
        if (node.depth > collapsedDepth) {
          continue;
        }

        collapsedDepth = null;
      }

      visibleNodes.push(node);

      if (node.hasChildren && !isExpanded(node.nodeId, options)) {
        collapsedDepth = node.depth;
      }
    }

    return visibleNodes;
  }
}
