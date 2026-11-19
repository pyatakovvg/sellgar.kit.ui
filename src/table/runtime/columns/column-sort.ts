import type { TableColumnSortConfig, TableSortDirection } from '../../core/column';

export interface ColumnSortSnapshot {
  readonly columnId?: string;
  readonly direction?: TableSortDirection;
}

interface SortColumn {
  readonly id: string;
  readonly config: TableColumnSortConfig;
}

const EMPTY_SORT: ColumnSortSnapshot = {};

/** Хранит активный запрос сортировки; порядок данных по-прежнему задаёт потребитель. */
export class ColumnSort {
  private columns = new Map<string, TableColumnSortConfig>();
  private snapshot: ColumnSortSnapshot = EMPTY_SORT;
  private readonly listeners = new Set<() => void>();

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  getSnapshot = (): ColumnSortSnapshot => this.snapshot;

  configure(columns: readonly SortColumn[]): void {
    const previousId = this.snapshot.columnId;
    const previous = previousId ? this.columns.get(previousId) : undefined;
    this.columns = new Map(columns.map((column) => [column.id, column.config]));
    if (previousId && this.columns.has(previousId)) return;
    const initial = columns.find((column) => column.config.directionDefault);
    this.install(initial ? { columnId: initial.id, direction: initial.config.directionDefault } : EMPTY_SORT);
    if (previousId) previous?.onReset?.();
  }

  toggle(columnId: string): void {
    const column = this.columns.get(columnId);
    if (!column) return;
    const previous = this.snapshot.columnId;
    const direction = previous === columnId && this.snapshot.direction === 'asc' ? 'desc' : 'asc';
    this.install({ columnId, direction });
    if (previous && previous !== columnId) this.columns.get(previous)?.onReset?.();
    column.onToggle(direction);
  }

  private install(snapshot: ColumnSortSnapshot): void {
    if (snapshot.columnId === this.snapshot.columnId && snapshot.direction === this.snapshot.direction) return;
    this.snapshot = snapshot;
    this.listeners.forEach((listener) => listener());
  }
}
