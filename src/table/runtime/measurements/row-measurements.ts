export class RowMeasurements {
  private readonly cells = new Map<string, Map<string, number>>();
  private readonly expanded = new Map<string, number>();

  expandedHeight(rowId: string): number {
    return this.expanded.get(rowId) ?? 0;
  }

  measureExpanded(rowId: string, height: number): void {
    this.expanded.set(rowId, height);
  }

  measure(rowId: string, columnId: string, height: number, minimum: number): number {
    let row = this.cells.get(rowId);
    if (!row) {
      row = new Map();
      this.cells.set(rowId, row);
    }
    row.set(columnId, height);
    return Math.max(minimum, ...row.values());
  }

  invalidate(rowIds?: readonly string[]): void {
    if (!rowIds) this.cells.clear();
    else rowIds.forEach((id) => this.cells.delete(id));
  }

  retain(ids: ReadonlySet<string>): void {
    for (const id of this.cells.keys()) if (!ids.has(id)) this.cells.delete(id);
    for (const id of this.expanded.keys()) if (!ids.has(id)) this.expanded.delete(id);
  }
}
