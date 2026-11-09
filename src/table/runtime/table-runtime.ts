import { Axis } from '../core/geometry/axis';
import { headerViewportTop } from '../core/geometry/header';
import { ColumnRuntime } from './columns/column-runtime';
import { RowMeasurements } from './measurements/row-measurements';
import { visibleTreeIds } from '../core/tree/visible-tree-ids';

import type { GeometryColumn } from '../core/layout/types';
import type { TableMeasurement, TableRuntimeOptions, TableSnapshot, TableViewport } from './types';

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

interface RowAnchor {
  readonly ids: readonly string[];
  readonly index: number;
  readonly offset: number;
  readonly inner: number;
}

export class TableRuntime {
  private rowIds: readonly string[] = [];
  private allRowIds: readonly string[] = [];
  private readonly treeToggled = new Set<string>();
  private treeBranches = new Set<string>();
  private rowIndex = new Map<string, number>();
  private rowAxis = new Axis([]);
  private readonly measurements = new RowMeasurements();
  private readonly listeners = new Set<() => void>();
  private viewport = INITIAL_VIEWPORT;
  private options: TableRuntimeOptions = { rowHeight: 54, minRowHeight: 54, overscan: 3, virtual: true, sticky: true };
  private readonly columnRuntime = new ColumnRuntime(INITIAL_VIEWPORT, this.options);
  private columnRevision = 0;
  private headerHeight = 28;
  private emptyHeight = 0;
  private version = 0;
  private readonly expanded = new Set<string>();
  private snapshot: TableSnapshot = {
    columns: [],
    rows: [],
    widths: [],
    rowCount: 0,
    columnCount: 0,
    total: 0,
    minimumWidth: 0,
    contentEpoch: 0,
    bodyHeight: 0,
    headerHeight: 28,
    headerTop: 0,
    headerFloating: false,
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
  ): number {
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
    const rowAnchor = this.captureRowAnchor();
    const metricsChanged =
      options.rowHeight !== this.options.rowHeight || options.minRowHeight !== this.options.minRowHeight;
    const oldHeights = metricsChanged ? new Map<string, number>() : this.contentHeights();
    const contentChanged =
      changedRows.length > 0 ||
      rowIds.length !== this.allRowIds.length ||
      rowIds.some((id, index) => id !== this.allRowIds[index]);
    this.options = options;
    this.allRowIds = rowIds;
    if (rowIds.length) this.emptyHeight = 0;
    this.treeBranches = new Set(options.tree?.nodes.filter((node) => node.hasChildren).map((node) => node.nodeId));
    const retained = new Set(rowIds);
    for (const id of this.treeToggled) if (!options.tree || !retained.has(id)) this.treeToggled.delete(id);
    for (const id of this.expanded) if (!options.expansion || !retained.has(id)) this.expanded.delete(id);
    this.measurements.retain(retained);
    this.updateVisibleRows(oldHeights);
    if (changedRows.length || metricsChanged) {
      this.version++;
      this.measurements.invalidate(changedRows);
    }
    this.columnRuntime.configure(columns, options);
    if (contentChanged) this.columnRuntime.resetContentWidths();
    const correction = this.restoreRowAnchor(rowAnchor);
    this.publish();
    return correction;
  }

  updateViewport(viewport: TableViewport): void {
    const previous = this.viewport;
    if (Object.keys(viewport).every((key) => Reflect.get(previous, key) === Reflect.get(viewport, key))) return;
    this.viewport = viewport;
    this.columnRuntime.updateViewport(viewport);
    this.publish();
  }

  setNestedWidth(id: string, width: number | undefined): void {
    this.columnRuntime.setNestedWidth(id, width);
    this.publish();
  }

  setHeaderHeight(height: number): void {
    if (Math.abs(height - this.headerHeight) < 0.1) return;
    this.headerHeight = height;
    this.publish();
  }

  commitContentWidths(entries: readonly { columnId: string; width: number }[], epoch: number): void {
    this.columnRuntime.commitContentWidths(entries, epoch);
    this.publish();
  }

  beginResize(columnId: string, x: number): boolean {
    const accepted = this.columnRuntime.beginResize(columnId, x);
    if (accepted) this.publish();
    return accepted;
  }

  resetColumnWidth(columnId: string): boolean {
    const accepted = this.columnRuntime.resetColumnWidth(columnId);
    if (accepted) this.publish();
    return accepted;
  }

  beginPinResize(columnId: string, x: number, edge: 'left' | 'right'): boolean {
    const accepted = this.columnRuntime.beginPinResize(columnId, x, edge);
    if (accepted) this.publish();
    return accepted;
  }

  moveResize(x: number): void {
    this.columnRuntime.moveResize(x);
    this.publish();
  }

  finishResize(): void {
    this.columnRuntime.finishResize();
    this.publish();
  }

  cancelResize(): void {
    this.columnRuntime.cancelResize();
    this.publish();
  }

  rebaseResize(x: number): void {
    this.columnRuntime.rebaseResize(x);
  }

  isExpanded(rowId: string): boolean {
    return this.expanded.has(rowId);
  }

  isTreeExpanded(rowId: string): boolean {
    return Boolean(this.options.tree?.defaultExpanded) !== this.treeToggled.has(rowId);
  }

  toggleTree(rowId: string): number {
    if (!this.treeBranches.has(rowId) || !this.rowIndex.has(rowId)) return 0;
    const anchor = this.captureRowAnchor();
    if (!this.treeToggled.delete(rowId)) this.treeToggled.add(rowId);
    this.updateVisibleRows();
    const correction = this.restoreRowAnchor(anchor, rowId);
    this.version++;
    this.publish();
    return correction;
  }

  private contentHeights(): Map<string, number> {
    return new Map(
      this.rowIds.map((id, index) => [
        id,
        this.rowAxis.sizes[index] - (this.expanded.has(id) ? this.measurements.expandedHeight(id) : 0),
      ]),
    );
  }

  private updateVisibleRows(oldHeights = this.contentHeights()): void {
    this.rowIds = this.options.tree
      ? visibleTreeIds(this.options.tree.nodes, this.treeToggled, Boolean(this.options.tree.defaultExpanded))
      : this.allRowIds;
    this.rowIndex = new Map(this.rowIds.map((id, index) => [id, index]));
    this.rowAxis = new Axis(
      this.rowIds.map(
        (id) =>
          Math.max(
            this.options.minRowHeight,
            oldHeights.get(id) ?? this.measurements.height(id, this.options.minRowHeight) ?? this.options.rowHeight,
          ) + (this.expanded.has(id) ? this.measurements.expandedHeight(id) : 0),
      ),
    );
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
        if (entry.version !== this.version || !Number.isFinite(entry.height) || entry.height < 0) continue;
        if ('kind' in entry && entry.kind === 'empty') {
          if (this.rowIds.length || Math.abs(this.emptyHeight - entry.height) < 0.1) continue;
          this.emptyHeight = entry.height;
          changed = true;
          continue;
        }
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
    const anchor = this.captureRowAnchor();
    if (!update()) return 0;
    const correction = this.restoreRowAnchor(anchor);
    this.publish();
    return correction;
  }

  private captureRowAnchor(): RowAnchor | undefined {
    if (this.viewport.scroll < 0 || this.viewport.width <= 0 || this.viewport.height <= 0) return;
    const top = this.visibleTop();
    const index = this.rowAxis.at(top);
    if (index < 0) return;
    const offset = this.rowAxis.offset(index);
    return { ids: this.rowIds, index, offset, inner: top - offset };
  }

  private restoreRowAnchor(anchor: RowAnchor | undefined, fallbackId?: string): number {
    if (!anchor || !this.rowIds.length) return 0;
    const id = this.rowIndex.has(anchor.ids[anchor.index])
      ? anchor.ids[anchor.index]
      : (fallbackId ??
        anchor.ids.slice(anchor.index + 1).find((id) => this.rowIndex.has(id)) ??
        anchor.ids
          .slice(0, anchor.index)
          .reverse()
          .find((id) => this.rowIndex.has(id)));
    const index = id === undefined ? undefined : this.rowIndex.get(id);
    if (index === undefined) return 0;
    const inner =
      fallbackId && !this.rowIndex.has(anchor.ids[anchor.index])
        ? 0
        : Math.min(anchor.inner, Math.max(0, this.rowAxis.sizes[index] - 0.1));
    const correction = this.rowAxis.offset(index) - anchor.offset + inner - anchor.inner;
    this.viewport = { ...this.viewport, scroll: this.viewport.scroll + correction };
    return correction;
  }

  private visibleTop(): number {
    const cover = this.options.sticky && this.viewport.scroll > 0 ? this.headerHeight : 0;
    return Math.max(0, this.viewport.scroll + cover - this.headerHeight);
  }

  private publish(): void {
    if (this.columnRevision !== this.columnRuntime.revision) {
      this.columnRevision = this.columnRuntime.revision;
      this.version++;
      this.measurements.invalidate();
    }
    const { scroll, height } = this.viewport;
    const bodyHeight = this.rowIds.length
      ? this.rowAxis.total
      : Math.max(this.options.rowHeight, this.options.minRowHeight, this.emptyHeight);
    const visibleRows = this.options.virtual
      ? this.rowAxis.range(this.visibleTop(), scroll + height - this.headerHeight, this.options.overscan)
      : this.rowIds.map((_, index) => index);
    const expandedRows = [...this.expanded].flatMap((id) => {
      const index = this.rowIndex.get(id);
      return index === undefined ? [] : [index];
    });
    const rows = [...new Set([...visibleRows, ...expandedRows])].sort((a, b) => a - b);
    this.snapshot = {
      columns: this.columnRuntime.visibleColumns(),
      rows: rows.map((index) => ({
        id: this.rowIds[index],
        index,
        top: this.rowAxis.offset(index),
        height: this.rowAxis.sizes[index],
        contentHeight:
          this.rowAxis.sizes[index] -
          (this.expanded.has(this.rowIds[index]) ? this.measurements.expandedHeight(this.rowIds[index]) : 0),
        expanded: this.expanded.has(this.rowIds[index]),
        treeExpanded: this.treeBranches.has(this.rowIds[index]) ? this.isTreeExpanded(this.rowIds[index]) : undefined,
      })),
      widths: this.columnRuntime.widths,
      rowCount: this.rowIds.length,
      columnCount: this.columnRuntime.count,
      total: this.columnRuntime.total,
      minimumWidth: this.columnRuntime.minimumWidth(),
      contentEpoch: this.columnRuntime.contentEpoch,
      bodyHeight,
      headerHeight: this.headerHeight,
      headerTop: this.options.sticky
        ? headerViewportTop(scroll, 0, this.headerHeight, this.headerHeight + bodyHeight)
        : -scroll,
      headerFloating: this.options.sticky && scroll > 0 && scroll < this.headerHeight + bodyHeight,
      viewport: this.viewport,
      version: this.version,
      dragging: this.columnRuntime.dragging,
      error: this.columnRuntime.error,
      pinning: this.columnRuntime.pinning,
      regions: this.columnRuntime.regions,
    };
    this.listeners.forEach((listener) => listener());
  }
}
