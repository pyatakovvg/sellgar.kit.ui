import { flattenTree } from '../core/tree/flatten-tree';

import type { TableNodeModel } from '../core/column';

export class RowIdentities {
  private readonly objects = new WeakMap<object, string>();
  private sequence = 0;

  identify<T extends object>(
    rows: readonly T[],
    getRowId?: (row: T) => string,
    getChildren?: (row: T) => unknown,
  ): { id: string; data: T; index: number; node: TableNodeModel<T> }[] {
    const nodes = flattenTree(
      rows,
      (data) => {
        let id = getRowId ? getRowId(data) : this.objects.get(data);
        if (id === undefined) {
          id = `row:${++this.sequence}`;
          this.objects.set(data, id);
        }
        return id;
      },
      getChildren,
    );
    return nodes.map((node) => ({ id: node.nodeId, data: node.data, index: node.index, node }));
  }
}
