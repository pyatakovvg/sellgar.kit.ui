import { Axis } from '../../core/geometry/axis';
import { projectColumns, tableLayout, tablePinResizeBounds } from '../../core/geometry/table-layout';
import {
  automatic,
  clamp,
  resize,
  resizeBounds,
  resizeDirections,
  sharedLayout,
} from '../../core/layout/column-layout';
import { initializePins, PinBudgetError, pinLayout, resizePin } from '../../core/pinning';

import type { TableLayout } from '../../core/geometry/types';
import type { GeometryColumn, Layout, LayoutAnchor } from '../../core/layout/types';
import type { PinColumn, PinningViewport } from '../../core/pinning';
import type { TableColumnGeometry, TableRuntimeOptions, TableViewport } from '../types';

interface Checkpoint {
  readonly columns: GeometryColumn[];
  readonly pins: readonly PinColumn[];
  readonly layout: Layout;
  readonly anchor?: LayoutAnchor;
  readonly centerAnchor?: LayoutAnchor;
  readonly container: number;
  readonly pinned: boolean;
}

interface ResizeOperation {
  readonly id: string;
  readonly kind: 'center' | 'pin';
  readonly edge: 'left' | 'right';
  readonly startX: number;
  readonly startWidth: number;
  readonly lastX: number;
  readonly working: Checkpoint;
  readonly rollback: Checkpoint;
}

const DEFAULT_PIN_RESERVE = 50;

const EMPTY_LAYOUT: Layout = { base: [], widths: [], total: 0, overflow: 0, underfill: 0 };

export class ColumnRuntime {
  private columns: GeometryColumn[] = [];
  private declarations = new Map<string, GeometryColumn>();
  private layout: Layout = EMPTY_LAYOUT;
  private geometry?: TableLayout;
  private pins = new Map<string, PinColumn>();
  private anchor?: LayoutAnchor;
  private centerAnchor?: LayoutAnchor;
  private operation?: ResizeOperation;
  private readonly nestedWidths = new Map<string, number>();
  private viewport: TableViewport;
  private options: TableRuntimeOptions;
  private schema = '';
  private axis = new Axis([]);
  private failure?: string;
  private revisionValue = 0;

  constructor(viewport: TableViewport, options: TableRuntimeOptions) {
    this.viewport = viewport;
    this.options = options;
  }

  configure(columns: GeometryColumn[], options: TableRuntimeOptions): void {
    const schema = JSON.stringify(
      columns.map(({ id, mode, width, floor, max, pin }) => [id, mode, width, floor, String(max), pin]),
    );
    const changed = schema !== this.schema || (options.pinning?.reserve ?? DEFAULT_PIN_RESERVE) !== this.reserve;
    if (changed && this.operation) this.restore(this.operation.rollback);
    this.options = options;
    if (changed) {
      this.operation = undefined;
      const old = new Map(this.columns.map((column) => [column.id, column]));
      const retainedPins = new Map<string, PinColumn>();
      this.columns = columns.map((column) => {
        const previous = this.declarations.get(column.id);
        const sameSize =
          previous &&
          previous.mode === column.mode &&
          previous.width === column.width &&
          previous.floor === column.floor &&
          previous.max === column.max;
        const pin = this.pins.get(column.id);
        if (sameSize && pin && pin.side === column.pin) retainedPins.set(column.id, pin);
        return sameSize
          ? { ...old.get(column.id)!, pin: column.pin, resizable: column.resizable === true }
          : { ...column };
      });
      this.pins = retainedPins;
      this.declarations = new Map(columns.map((column) => [column.id, { ...column }]));
      this.anchor = undefined;
      this.centerAnchor = undefined;
      this.geometry = undefined;
      this.layout = EMPTY_LAYOUT;
      this.schema = schema;
      this.revisionValue++;
    } else {
      if (this.operation && columns.find((column) => column.id === this.operation!.id)?.resizable !== true)
        this.cancelResize();
      const permissions = new Map(columns.map((column) => [column.id, column.resizable === true]));
      this.columns.forEach((column) => {
        column.resizable = permissions.get(column.id);
      });
    }
    if (!this.operation) this.reflow();
  }

  updateViewport(viewport: TableViewport): void {
    const previous = this.viewport;
    this.viewport = viewport;
    if (
      Math.abs(previous.container - viewport.container) > 1e-7 ||
      previous.available !== viewport.available ||
      (this.hasPins() && previous.width !== viewport.width)
    )
      this.reflow();
  }

  setNestedWidth(id: string, width: number | undefined): void {
    if (width !== undefined && (!Number.isFinite(width) || width < 0))
      throw new RangeError('Nested table width must be finite and non-negative.');
    if (this.nestedWidths.get(id) === width) return;
    const before = [this.layoutContainer(), this.resizeContainer()];
    if (width === undefined) this.nestedWidths.delete(id);
    else this.nestedWidths.set(id, width);
    if (!this.operation || before[0] !== this.layoutContainer() || before[1] !== this.resizeContainer()) this.reflow();
  }

  get dragging(): boolean {
    return Boolean(this.operation);
  }

  get revision(): number {
    return this.revisionValue;
  }

  get error(): string | undefined {
    return this.failure;
  }

  get count(): number {
    return this.columns.length;
  }

  get total(): number {
    return this.geometry?.total ?? this.layout.total;
  }

  get widths(): readonly number[] {
    return this.geometry?.columns.map((column) => column.width) ?? this.layout.widths;
  }

  get regions(): TableLayout['regions'] | undefined {
    return this.geometry?.regions;
  }

  get pinning() {
    if (!this.hasPins()) return undefined;
    return {
      status: this.geometry ? ('active' as const) : ('suspended' as const),
      columns: [...this.pins.values()],
      reserve: this.reserve,
    };
  }

  minimumWidth(): number {
    const columns = this.workingColumns();
    let own = columns.reduce(
      (sum, column) => sum + (column.mode === 'fixed' ? column.width : Math.max(column.floor, column.manual ?? 0)),
      0,
    );
    if (
      !this.failure &&
      this.viewport.available !== undefined &&
      columns.some((column) => column.manual !== undefined)
    ) {
      own = Math.max(own, automatic(columns, this.resizeContainer(), this.currentAnchor()).total);
    }
    return Math.max(own + (this.geometry?.pins.totalWidth ?? 0), 0, ...this.nestedWidths.values());
  }

  visibleColumns(): TableColumnGeometry[] {
    if (this.failure) return [];
    const geometry = this.geometry;
    const visible = new Set(
      this.axis.range(
        Math.max(0, this.viewport.left + (geometry?.pins.leftWidth ?? 0)),
        this.viewport.left + this.viewport.width - (geometry?.pins.rightWidth ?? 0),
        1,
      ),
    );
    const projected = geometry
      ? projectColumns(geometry, this.viewport.left)
      : this.columns.map((column, index) => ({
          id: column.id,
          sourceIndex: index,
          region: 'center' as const,
          width: this.layout.widths[index],
          offset: this.axis.offset(index),
          displayOffset: this.axis.offset(index) - this.viewport.left,
          shift: 0,
          clipLeft: 0,
          clipRight: 0,
        }));
    const working = this.workingColumns();
    const centerIndices = new Map(working.map((column, index) => [column.id, index]));
    return projected.flatMap((column, index) => {
      if (this.options.virtual && column.region === 'center' && !visible.has(index)) return [];
      const source = this.columns[column.sourceIndex];
      const centerIndex = centerIndices.get(column.id) ?? -1;
      const isPin = column.region !== 'center';
      const resizeEdge = column.region === 'right' ? 'left' : 'right';
      const bounds = isPin ? this.pinBounds(column.id) : undefined;
      const canShrink = bounds ? column.width > bounds.min + 1e-7 : false;
      const canGrow = bounds ? column.width < bounds.max - 1e-7 : false;
      return [
        {
          ...column,
          index,
          resizeEdge,
          ...(isPin
            ? {
                left: resizeEdge === 'left' ? canGrow : canShrink,
                right: resizeEdge === 'left' ? canShrink : canGrow,
                resizeBounds: bounds,
              }
            : resizeDirections(working, this.layout, this.resizeContainer(), centerIndex)),
          resizable: source.resizable === true && (isPin || centerIndex < working.length - 1),
        },
      ];
    });
  }

  beginResize(id: string, x: number): boolean {
    return this.begin(id, x, 'center', 'right');
  }

  beginPinResize(id: string, x: number, edge: 'left' | 'right'): boolean {
    return this.begin(id, x, 'pin', edge);
  }

  private begin(id: string, x: number, kind: 'center' | 'pin', edge: 'left' | 'right'): boolean {
    if (this.failure || this.operation || !Number.isFinite(x) || (edge !== 'left' && edge !== 'right')) return false;
    const source = this.columns.find((column) => column.id === id);
    if (!source || source.resizable !== true) return false;
    let startWidth: number;
    if (kind === 'pin') {
      if (!this.geometry || !this.pins.has(id)) return false;
      const bounds = this.pinBounds(id);
      if (bounds.max - bounds.min < 1e-7) return false;
      startWidth = this.pins.get(id)!.width;
    } else {
      const working = this.workingColumns();
      const index = working.findIndex((column) => column.id === id);
      if (index < 0) return false;
      const allowed = resizeDirections(working, this.layout, this.resizeContainer(), index);
      if (!allowed.left && !allowed.right) return false;
      startWidth = this.layout.widths[index];
    }
    const checkpoint = this.checkpoint();
    this.operation = { id, kind, edge, startX: x, lastX: x, startWidth, working: checkpoint, rollback: checkpoint };
    return true;
  }

  moveResize(x: number): void {
    const operation = this.operation;
    if (!operation || !Number.isFinite(x)) return;
    this.operation = { ...operation, lastX: x };
    const checkpoint = operation.working;
    if (operation.kind === 'pin') {
      const delta = (x - operation.startX) * (operation.edge === 'left' ? -1 : 1);
      const bounds = this.pinBounds(operation.id, checkpoint.pins);
      const requested = clamp(operation.startWidth + delta, bounds.min, bounds.max);
      const next = resizePin(checkpoint.pins, this.pinViewport(), operation.id, requested);
      const previous = this.pins;
      this.pins = new Map(next.columns.map((column) => [column.id, column]));
      try {
        this.calculate();
      } catch (error) {
        // Reject a request that cannot produce a valid center; retain the last valid geometry.
        this.pins = previous;
        if (!(error instanceof RangeError)) throw error;
      }
      return;
    }
    const working = checkpoint.columns.filter((column) => !checkpoint.pinned || !column.pin);
    const index = working.findIndex((column) => column.id === operation.id);
    if (Math.abs(x - operation.startX) < 1e-7) {
      this.columns = checkpoint.columns.map((column) => ({ ...column }));
      this.applyCenter(checkpoint.layout);
      return;
    }
    const bounds = resizeBounds(working, checkpoint.layout, this.resizeContainer(), index);
    const requested = clamp(operation.startWidth + x - operation.startX, bounds.min, bounds.max);
    const next = resize(working, checkpoint.layout, this.resizeContainer(), index, requested);
    const byId = new Map(next.columns.map((column) => [column.id, column]));
    this.columns = this.columns.map((column) => byId.get(column.id) ?? column);
    this.applyCenter(next.layout);
  }

  finishResize(): void {
    const operation = this.operation;
    if (!operation) return;
    this.operation = undefined;
    const column = this.columns.find((item) => item.id === operation.id)!;
    const before = operation.rollback.columns.find((item) => item.id === operation.id)!;
    if (operation.kind === 'center' && column.mode === 'fixed' && column.width !== before.width) {
      const anchor = { container: this.resizeContainer(), bases: this.layout.base.slice() };
      if (this.geometry) this.centerAnchor = anchor;
      else {
        this.anchor = anchor;
        this.centerAnchor = undefined;
      }
    }
  }

  cancelResize(): void {
    const operation = this.operation;
    if (!operation) return;
    this.operation = undefined;
    this.restore(operation.rollback);
    if (operation.rollback.container === this.resizeContainer() && operation.rollback.pinned === Boolean(this.geometry))
      this.applyCenter(operation.rollback.layout);
    else this.reflow();
  }

  rebaseResize(x: number): void {
    const operation = this.operation;
    if (!operation || this.failure || !Number.isFinite(x)) return;
    this.operation = {
      ...operation,
      startX: x,
      lastX: x,
      working: this.checkpoint(),
      startWidth:
        operation.kind === 'pin'
          ? this.pins.get(operation.id)!.width
          : this.layout.widths[this.workingColumns().findIndex((column) => column.id === operation.id)],
    };
  }

  private checkpoint(): Checkpoint {
    return {
      columns: this.columns.map((column) => ({ ...column })),
      pins: [...this.pins.values()],
      layout: this.layout,
      anchor: this.anchor,
      centerAnchor: this.centerAnchor,
      container: this.resizeContainer(),
      pinned: Boolean(this.geometry),
    };
  }

  private restore(checkpoint: Checkpoint): void {
    this.columns = checkpoint.columns.map((column) => ({ ...column }));
    this.pins = new Map(checkpoint.pins.map((column) => [column.id, column]));
    this.anchor = checkpoint.anchor;
    this.centerAnchor = checkpoint.centerAnchor;
  }

  private hasPins(): boolean {
    return this.columns.some((column) => column.pin !== undefined);
  }

  private workingColumns(): GeometryColumn[] {
    return this.geometry ? this.columns.filter((column) => !column.pin) : this.columns;
  }

  private layoutContainer(): number {
    return Math.max(this.viewport.container, 0, ...this.nestedWidths.values());
  }

  private resizeContainer(): number {
    return this.geometry
      ? this.geometry.center.availableWidth
      : Math.max(this.viewport.available ?? this.viewport.container, 0, ...this.nestedWidths.values());
  }

  private get reserve(): number {
    return this.options.pinning?.reserve ?? DEFAULT_PIN_RESERVE;
  }

  private pinViewport(): PinningViewport {
    return { width: this.viewport.width, reserve: this.reserve };
  }

  private pinBounds(id: string, pins: readonly PinColumn[] = [...this.pins.values()]) {
    return tablePinResizeBounds(
      this.columns,
      pins,
      { ...this.pinViewport(), surfaceWidth: Math.max(this.viewport.width, this.layoutContainer()) },
      id,
    );
  }

  private currentAnchor(pinned = Boolean(this.geometry)): LayoutAnchor | undefined {
    const operation = this.operation;
    if (
      operation?.kind === 'center' &&
      operation.working.pinned === pinned &&
      this.columns.find((column) => column.id === operation.id)?.mode === 'fixed'
    ) {
      return { container: operation.working.container, bases: this.layout.base.slice() };
    }
    return pinned ? this.centerAnchor : this.anchor;
  }

  private reflow(): void {
    const operation = this.operation;
    const before = Boolean(this.geometry);
    try {
      this.calculate();
      if (operation && before !== Boolean(this.geometry)) {
        this.operation = undefined;
        this.restore(operation.rollback);
        this.calculate();
      } else if (operation) this.rebaseResize(operation.lastX);
    } catch (error) {
      this.operation = undefined;
      this.failure = error instanceof Error ? error.message : 'Invalid table geometry.';
      this.geometry = undefined;
      this.install(EMPTY_LAYOUT);
    }
  }

  private preparePins(): boolean {
    if (!this.hasPins()) return false;
    const reserve = this.reserve;
    if (!Number.isFinite(reserve) || reserve < 0)
      throw new RangeError('Pinned columns require a finite non-negative center reserve.');
    if (!this.columns.some((column) => !column.pin && column.mode === 'auto'))
      throw new Error('Pinned table geometry must retain an automatic center column.');
    if (this.viewport.width === 0 || this.viewport.width < reserve) return false;
    const viewport = this.pinViewport();
    try {
      pinLayout([...this.pins.values()], viewport);
      const missing = this.columns.filter((column) => column.pin && !this.pins.has(column.id));
      if (missing.length) {
        const initial = automatic(this.columns, Math.max(this.viewport.available ?? this.viewport.container, 0));
        const bases = new Map(this.columns.map((column, index) => [column.id, initial.base[index]]));
        const next = initializePins(
          [...this.pins.values()],
          viewport,
          missing.map((column) => ({
            id: column.id,
            side: column.pin!,
            minWidth: column.floor,
            maxWidth: column.max,
            source:
              column.mode === 'auto'
                ? { mode: 'auto' as const, base: bases.get(column.id)! }
                : { mode: 'fixed' as const, declaredWidth: this.declarations.get(column.id)!.width },
          })),
        );
        this.pins = new Map(next.columns.map((column) => [column.id, column]));
      }
      return true;
    } catch (error) {
      if (error instanceof PinBudgetError) return false;
      throw error;
    }
  }

  private calculate(anchorOverride?: LayoutAnchor): void {
    const previousPins = this.pins;
    try {
      this.calculateLayout(anchorOverride);
    } catch (error) {
      this.pins = previousPins;
      throw error;
    }
  }

  private calculateLayout(anchorOverride?: LayoutAnchor): void {
    if (this.preparePins()) {
      const geometry = tableLayout(
        this.columns,
        [...this.pins.values()],
        {
          ...this.pinViewport(),
          surfaceWidth: Math.max(this.viewport.width, this.layoutContainer()),
        },
        anchorOverride ?? this.currentAnchor(true),
      );
      this.geometry = geometry;
      this.install(geometry.center.layout);
    } else {
      const anchor = this.currentAnchor(false);
      this.geometry = undefined;
      this.install(
        this.viewport.available === undefined
          ? automatic(this.columns, this.layoutContainer(), anchor)
          : sharedLayout(this.columns, this.layoutContainer(), this.resizeContainer(), anchor),
      );
    }
    this.failure = undefined;
  }

  private applyCenter(layout: Layout): void {
    if (this.geometry) this.calculate({ container: this.resizeContainer(), bases: layout.base.slice() });
    else {
      this.install(layout);
      this.failure = undefined;
    }
  }

  private install(layout: Layout): void {
    const widths = this.geometry?.columns.map((column) => column.width) ?? layout.widths;
    if (
      widths.length !== this.axis.sizes.length ||
      widths.some((width, index) => Math.abs(width - this.axis.sizes[index]) > 1e-7)
    )
      this.revisionValue++;
    this.layout = layout;
    this.axis = new Axis(widths);
  }
}
