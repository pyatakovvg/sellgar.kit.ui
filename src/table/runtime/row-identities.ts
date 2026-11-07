export class RowIdentities {
  private readonly objects = new WeakMap<object, string>();
  private sequence = 0;

  identify<T extends object>(
    rows: readonly T[],
    getRowId?: (row: T) => string,
  ): { id: string; data: T; index: number }[] {
    const ids = new Set<string>();
    return rows.map((data, index) => {
      let id = getRowId ? getRowId(data) : this.objects.get(data);
      if (id === undefined) {
        id = `row:${++this.sequence}`;
        this.objects.set(data, id);
      }
      if (!id || ids.has(id)) throw new Error('Table rows must have unique, non-empty identities.');
      ids.add(id);
      return { id, data, index };
    });
  }
}
