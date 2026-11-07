import { Axis } from '../core/geometry/axis';
import { headerViewportTop } from '../core/geometry/header';
import { automatic, clamp, resize, resizeBounds, resizeDirections } from '../core/layout/column-layout';
import { RowMeasurements } from './measurements/row-measurements';

import type { GeometryColumn, Layout, LayoutAnchor } from '../core/layout/types';
import type {
  TableMeasurement,
  TableResizeOperation,
  TableRuntimeOptions,
  TableSnapshot,
  TableViewport,
} from './types';

const INITIAL_VIEWPORT: TableViewport = {
  container: 0,
  width: 0,
  height: 0,
  scroll: 0,
  left: 0,
  top: 0,
  screenLeft: 0,
  scale: 1,
};

export class TableRuntime {
  private columns: GeometryColumn[] = [];
  private layout: Layout = { widths: [], base: [], total: 0, overflow: 0, underfill: 0 };
  private anchor?: LayoutAnchor;
  private readonly nestedWidths = new Map<string, number>();
  private rowIds: readonly string[] = [];
  private rowIndex = new Map<string, number>();
  private rowAxis = new Axis([]);
  private columnAxis = new Axis([]);
  private readonly measurements = new RowMeasurements();
  private readonly listeners = new Set<() => void>();
  private viewport = INITIAL_VIEWPORT;
  private options: TableRuntimeOptions = { rowHeight: 54, minRowHeight: 54, overscan: 3, virtual: true, sticky: true };
  private headerHeight = 28;
  private version = 0;
  private schema = '';
  private operation?: TableResizeOperation;
  private readonly expanded = new Set<string>();
  private error?: string;
  private snapshot: TableSnapshot = {
    columns: [],
    rows: [],
    widths: [],
    rowCount: 0,
    columnCount: 0,
    total: 0,
    minimumWidth: 0,
    bodyHeight: 0,
    headerHeight: 28,
    headerTop: 0,
    viewport: INITIAL_VIEWPORT,
    version: 0,
    dragging: false,
  };

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  getSnapshot = (): TableSnapshot => this.snapshot;

  configure(
    columns: GeometryColumn[],
    rowIds: readonly string[],
    changedRows: readonly string[],
    options: TableRuntimeOptions,
  ): void {
    if (
      !Number.isFinite(options.rowHeight) ||
      options.rowHeight <= 0 ||
      !Number.isFinite(options.minRowHeight) ||
      options.minRowHeight <= 0 ||
      !Number.isInteger(options.overscan) ||
      options.overscan < 0
    ) {
      throw new RangeError(
        'Table row estimates and minimum height must be positive; overscan must be a non-negative integer.',
      );
    }
    this.options = options;
    const schema = columns
      .map((column) => [column.id, column.mode, column.width, column.floor, column.max].join(':'))
      .join('|');
    const oldHeights = new Map(
      this.rowIds.map((id, index) => [
        id,
        this.rowAxis.sizes[index] - (this.expanded.has(id) ? this.measurements.expandedHeight(id) : 0),
      ]),
    );
    this.rowIds = rowIds;
    this.rowIndex = new Map(rowIds.map((id, index) => [id, index]));
    for (const id of this.expanded) if (!options.expansion || !this.rowIndex.has(id)) this.expanded.delete(id);
    this.rowAxis = new Axis(
      rowIds.map(
        (id) =>
          (oldHeights.get(id) ?? options.rowHeight) +
          (this.expanded.has(id) ? this.measurements.expandedHeight(id) : 0),
      ),
    );
    this.measurements.retain(new Set(rowIds));
    if (changedRows.length) {
      this.version++;
      this.measurements.invalidate(changedRows);
    }
    if (schema !== this.schema) {
      this.operation = undefined;
      this.schema = schema;
      this.columns = columns.map((column) => ({ ...column }));
      this.anchor = undefined;
      this.measurements.invalidate();
      this.version++;
    } else {
      if (this.operation && columns[this.operation.index].resizable !== true) this.cancelResize();
      this.columns.forEach((column, index) => {
        column.resizable = columns[index].resizable === true;
      });
    }
    this.reflow();
  }

  updateViewport(viewport: TableViewport): void {
    const previous = this.viewport;
    if (Object.keys(viewport).every((key) => Reflect.get(previous, key) === Reflect.get(viewport, key))) return;
    this.viewport = viewport;
    if (Math.abs(previous.container - viewport.container) > 1e-7) this.reflow();
    else this.publish();
  }

  setNestedWidth(id: string, width: number | undefined): void {
    if (width !== undefined && (!Number.isFinite(width) || width < 0))
      throw new RangeError('Nested table width must be finite and non-negative.');
    if (this.nestedWidths.get(id) === width) return;
    if (width === undefined) this.nestedWidths.delete(id);
    else this.nestedWidths.set(id, width);
    this.operation = undefined;
    this.reflow();
  }

  private minimumWidth(): number {
    const own = this.columns.reduce((sum, column) => sum + (column.mode === 'fixed' ? column.width : column.floor), 0);
    return Math.max(own, 0, ...this.nestedWidths.values());
  }

  private layoutContainer(): number {
    return Math.max(this.viewport.container, 0, ...this.nestedWidths.values());
  }

  setHeaderHeight(height: number): void {
    if (Math.abs(height - this.headerHeight) < 0.1) return;
    this.headerHeight = height;
    this.publish();
  }

  beginResize(columnId: string, x: number): boolean {
    const index = this.columns.findIndex((column) => column.id === columnId);
    if (index < 0 || index === this.columns.length - 1 || this.operation) return false;
    const allowed = resizeDirections(this.columns, this.layout, this.layoutContainer(), index);
    if (!allowed.left && !allowed.right) return false;
    this.operation = {
      index,
      startX: x,
      startWidth: this.layout.widths[index],
      container: this.layoutContainer(),
      columns: this.columns.map((column) => ({ ...column })),
      layout: this.layout,
      anchor: this.anchor,
    };
    this.publish();
    return true;
  }

  moveResize(x: number): void {
    const operation = this.operation;
    if (!operation) return;
    const bounds = resizeBounds(this.columns, this.layout, this.layoutContainer(), operation.index);
    const requested = clamp(operation.startWidth + x - operation.startX, bounds.min, bounds.max);
    const next = resize(this.columns, this.layout, this.layoutContainer(), operation.index, requested);
    this.columns = next.columns;
    this.apply(next.layout);
  }

  finishResize(): void {
    const operation = this.operation;
    if (!operation) return;
    this.operation = undefined;
    if (this.columns[operation.index].mode === 'fixed') {
      this.anchor = { container: this.layoutContainer(), bases: this.layout.base.slice() };
    }
    this.publish();
  }

  cancelResize(): void {
    const operation = this.operation;
    if (!operation) return;
    this.operation = undefined;
    this.columns = operation.columns;
    this.anchor = operation.anchor;
    if (operation.container === this.layoutContainer()) this.apply(operation.layout);
    else this.reflow();
  }

  isExpanded(rowId: string): boolean {
    return this.expanded.has(rowId);
  }

  toggleExpanded(rowId: string): number {
    const index = this.rowIndex.get(rowId);
    if (!this.options.expansion || index === undefined) return 0;
    return this.updateRowGeometry(() => {
      this.version++;
      const height = this.measurements.expandedHeight(rowId);
      if (this.expanded.delete(rowId)) this.rowAxis.set(index, this.rowAxis.sizes[index] - height);
      else {
        this.expanded.add(rowId);
        this.rowAxis.set(index, this.rowAxis.sizes[index] + height);
      }
      return true;
    });
  }

  commitMeasurements(entries: readonly TableMeasurement[]): number {
    return this.updateRowGeometry(() => {
      let changed = false;
      for (const entry of entries) {
        if (entry.version !== this.version) continue;
        const index = this.rowIndex.get(entry.rowId);
        if (index === undefined || !Number.isFinite(entry.height) || entry.height < 0) continue;
        const expandedHeight = this.expanded.has(entry.rowId) ? this.measurements.expandedHeight(entry.rowId) : 0;
        let height: number;
        if ('kind' in entry) {
          if (!this.expanded.has(entry.rowId)) continue;
          height = this.rowAxis.sizes[index] - expandedHeight + entry.height;
          this.measurements.measureExpanded(entry.rowId, entry.height);
        } else {
          height =
            this.measurements.measure(entry.rowId, entry.columnId, entry.height, this.options.minRowHeight) +
            expandedHeight;
        }
        if (Math.abs(this.rowAxis.sizes[index] - height) < 0.1) continue;
        this.rowAxis.set(index, height);
        changed = true;
      }
      return changed;
    });
  }

  private updateRowGeometry(update: () => boolean): number {
    const top = this.visibleTop();
    const anchorIndex = this.rowAxis.at(top);
    const previousOffset = anchorIndex < 0 ? 0 : this.rowAxis.offset(anchorIndex);
    const inner = top - previousOffset;
    if (!update()) return 0;
    let correction = 0;
    if (anchorIndex >= 0) {
      correction =
        this.rowAxis.offset(anchorIndex) -
        previousOffset +
        Math.min(inner, Math.max(0, this.rowAxis.sizes[anchorIndex] - 0.1)) -
        inner;
      this.viewport = { ...this.viewport, scroll: this.viewport.scroll + correction };
    }
    this.publish();
    return correction;
  }

  private reflow(): void {
    try {
      this.apply(automatic(this.columns, this.layoutContainer(), this.anchor));
    } catch (error) {
      this.error = error instanceof Error ? error.message : 'Invalid table geometry.';
      this.publish();
    }
  }

  private apply(layout: Layout): void {
    const changed =
      layout.widths.length !== this.layout.widths.length ||
      layout.widths.some((width, index) => Math.abs(width - this.layout.widths[index]) > 1e-7);
    this.layout = layout;
    this.error = undefined;
    this.columnAxis = new Axis(layout.widths);
    if (changed) {
      this.version++;
      this.measurements.invalidate();
    }
    this.publish();
  }

  private visibleTop(): number {
    const cover = this.options.sticky && this.viewport.scroll > 0 ? this.headerHeight : 0;
    return Math.max(0, this.viewport.scroll + cover - this.headerHeight);
  }

  private publish(): void {
    const { scroll, height, left, width } = this.viewport;
    const bodyHeight = this.rowIds.length ? this.rowAxis.total : this.options.rowHeight;
    const visibleRows = this.options.virtual
      ? this.rowAxis.range(this.visibleTop(), scroll + height - this.headerHeight, this.options.overscan)
      : this.rowIds.map((_, index) => index);
    const expandedRows = [...this.expanded].map((id) => this.rowIndex.get(id)!);
    const rows = [...new Set([...visibleRows, ...expandedRows])].sort((a, b) => a - b);
    const columns = this.options.virtual
      ? this.columnAxis.range(Math.max(0, left), left + width, 1)
      : this.columns.map((_, index) => index);
    this.snapshot = {
      columns: columns.map((index) => ({
        id: this.columns[index].id,
        index,
        width: this.layout.widths[index],
        ...resizeDirections(this.columns, this.layout, this.layoutContainer(), index),
        resizable: this.columns[index].resizable === true && index < this.columns.length - 1,
      })),
      rows: rows.map((index) => ({
        id: this.rowIds[index],
        index,
        top: this.rowAxis.offset(index),
        height: this.rowAxis.sizes[index],
        contentHeight:
          this.rowAxis.sizes[index] -
          (this.expanded.has(this.rowIds[index]) ? this.measurements.expandedHeight(this.rowIds[index]) : 0),
        expanded: this.expanded.has(this.rowIds[index]),
      })),
      widths: this.layout.widths,
      rowCount: this.rowIds.length,
      columnCount: this.columns.length,
      total: this.layout.total,
      minimumWidth: this.minimumWidth(),
      bodyHeight,
      headerHeight: this.headerHeight,
      headerTop: this.options.sticky
        ? headerViewportTop(scroll, 0, this.headerHeight, this.headerHeight + bodyHeight)
        : -scroll,
      viewport: this.viewport,
      version: this.version,
      dragging: Boolean(this.operation),
      error: this.error,
    };
    this.listeners.forEach((listener) => listener());
  }
}
