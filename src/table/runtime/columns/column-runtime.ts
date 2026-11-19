import { Axis } from '../../core/geometry/axis';
import { TABLE_COMPENSATOR_COLUMN_ID } from '../../core/column';
import { VirtualWindow } from '../rendering/virtual-window';
import { projectColumns, tableLayout, tablePinResizeBounds } from '../../core/geometry/table-layout';
import {
  automatic,
  automaticMinimum,
  clamp,
  resize,
  resizeBounds,
  resizeDirections,
  resizeMinimum,
  sharedLayout,
} from '../../core/layout/column-layout';
import { initializePins, PinBudgetError, pinLayout, resizePin } from '../../core/pinning';

import type { ProjectedColumnGeometry, TableLayout } from '../../core/geometry/types';
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
  private readonly initialPinWidths = new Map<string, number>();
  private anchor?: LayoutAnchor;
  private centerAnchor?: LayoutAnchor;
  private operation?: ResizeOperation;
  private readonly nestedWidths = new Map<string, number>();
  private viewport: TableViewport;
  private options: TableRuntimeOptions;
  private schema = '';
  private axis = new Axis([]);
  private readonly window = new VirtualWindow();
  private projected: readonly ProjectedColumnGeometry[] = [];
  private failure?: string;
  private revisionValue = 0;
  private readonly contentWidths = new Map<string, number>();
  private contentEpochValue = 0;
  private contentResetPending = false;

  constructor(viewport: TableViewport, options: TableRuntimeOptions) {
    this.viewport = viewport;
    this.options = options;
  }

  configure(input: GeometryColumn[], options: TableRuntimeOptions): void {
    const columns: GeometryColumn[] = [
      ...input,
      {
        id: TABLE_COMPENSATOR_COLUMN_ID,
        mode: 'auto',
        width: 0,
        floor: 0,
        max: Infinity,
        resizable: false,
        measureContent: false,
        compensator: true,
      },
    ];
    const schema = JSON.stringify(
      columns.map(({ id, mode, width, floor, max, pin, measureContent, resizeFloor }) => [
        id,
        mode,
        width,
        floor,
        String(max),
        pin,
        measureContent,
        resizeFloor,
      ]),
    );
    const changed = schema !== this.schema || (options.pinning?.reserve ?? DEFAULT_PIN_RESERVE) !== this.reserve;
    if (changed && this.operation) this.restore(this.operation.rollback);
    this.options = options;
    if (changed) {
      this.operation = undefined;
      const old = new Map(this.columns.map((column) => [column.id, column]));
      const retainedPins = new Map<string, PinColumn>();
      const retainedMeasurements = new Set<string>();
      this.columns = columns.map((column) => {
        const previous = this.declarations.get(column.id);
        const sameSize =
          previous &&
          previous.mode === column.mode &&
          previous.width === column.width &&
          previous.floor === column.floor &&
          previous.max === column.max &&
          previous.measureContent === column.measureContent &&
          previous.resizeFloor === column.resizeFloor;
        if (sameSize) retainedMeasurements.add(column.id);
        const pin = this.pins.get(column.id);
        if (sameSize && pin && pin.side === column.pin) retainedPins.set(column.id, pin);
        return sameSize
          ? { ...old.get(column.id)!, pin: column.pin, resizable: column.resizable === true }
          : { ...column };
      });
      this.pins = retainedPins;
      for (const id of this.initialPinWidths.keys()) if (!retainedPins.has(id)) this.initialPinWidths.delete(id);
      this.declarations = new Map(columns.map((column) => [column.id, { ...column }]));
      for (const id of this.contentWidths.keys()) if (!retainedMeasurements.has(id)) this.contentWidths.delete(id);
      this.contentResetPending = true;
      this.contentEpochValue++;
      this.applyContentFloors();
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

  setNestedWidth(id: string, width: number | undefined): boolean {
    if (width !== undefined && (!Number.isFinite(width) || width < 0))
      throw new RangeError('Nested table width must be finite and non-negative.');
    if (this.nestedWidths.get(id) === width) return false;
    const before = [this.layoutContainer(), this.resizeContainer()];
    if (width === undefined) this.nestedWidths.delete(id);
    else this.nestedWidths.set(id, width);
    if (!this.operation || before[0] !== this.layoutContainer() || before[1] !== this.resizeContainer()) this.reflow();
    return true;
  }

  get dragging(): boolean {
    return Boolean(this.operation);
  }

  get revision(): number {
    return this.revisionValue;
  }

  get contentEpoch(): number {
    return this.contentEpochValue;
  }

  resetContentWidths(): void {
    this.contentWidths.clear();
    this.contentResetPending = true;
    this.contentEpochValue++;
    if (!this.operation && this.applyContentFloors()) this.reflow();
  }

  commitContentWidths(entries: readonly { columnId: string; width: number }[], epoch: number): void {
    if (epoch !== this.contentEpochValue) return;
    for (const { columnId, width } of entries) {
      if (!Number.isFinite(width) || width < 0) throw new RangeError('Content widths must be finite and non-negative.');
      if (this.declarations.get(columnId)?.measureContent !== true) continue;
      this.contentWidths.set(columnId, Math.max(this.contentWidths.get(columnId) ?? 0, width));
    }
    if (!this.operation && this.applyContentFloors()) this.reflow();
  }

  private applyContentFloors(): boolean {
    let changed = false;
    for (const column of this.columns) {
      const declared = this.declarations.get(column.id)!;
      const measured = this.contentWidths.get(column.id);
      const floor =
        declared.measureContent && measured !== undefined
          ? Math.max(declared.floor, Math.min(measured, declared.max))
          : declared.floor;
      if (!this.contentResetPending && measured === undefined) continue;
      if (Math.abs(column.floor - floor) < 1e-7) continue;
      column.floor = floor;
      if (column.mode === 'fixed') column.width = Math.max(column.width, floor);
      const pin = this.pins.get(column.id);
      if (pin) {
        const minimum = resizeMinimum(column);
        const width = column.manual === undefined ? Math.max(pin.width, floor) : Math.max(pin.width, minimum);
        this.pins.set(column.id, { ...pin, minWidth: minimum, width });
      }
      changed = true;
    }
    this.contentResetPending = false;
    return changed;
  }

  get error(): string | undefined {
    return this.failure;
  }

  get count(): number {
    return this.widths.length;
  }

  get total(): number {
    return this.geometry?.total ?? this.layout.total;
  }

  get widths(): readonly number[] {
    return this.geometry
      ? this.geometry.columns
          .filter((column) => column.id !== TABLE_COMPENSATOR_COLUMN_ID || column.width > 1e-7)
          .map((column) => column.width)
      : this.layout.widths.filter((width, index) => !this.columns[index].compensator || width > 1e-7);
  }

  getWidth(columnId: string): number | undefined {
    if (this.failure) return undefined;
    if (this.geometry) return this.geometry.columns.find((column) => column.id === columnId)?.width;
    const index = this.columns.findIndex((column) => column.id === columnId);
    return index < 0 ? undefined : this.layout.widths[index];
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
      (sum, column) =>
        sum + (column.mode === 'fixed' ? column.width : Math.max(automaticMinimum(column), column.manual ?? 0)),
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
      this.window.range(
        this.axis,
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
          regionOffset: this.axis.offset(index),
          displayOffset: this.axis.offset(index) - this.viewport.left,
          shift: 0,
          clipLeft: 0,
          clipRight: 0,
        }));
    this.projected = projected.filter((column) => column.id !== TABLE_COMPENSATOR_COLUMN_ID || column.width > 1e-7);
    const working = this.workingColumns();
    const centerIndices = new Map(working.map((column, index) => [column.id, index]));
    return this.projected.flatMap((column, index) => {
      if (this.options.virtual && column.region === 'center' && !visible.has(index)) return [];
      return [this.describeColumn(column, index, working, centerIndices)];
    });
  }

  getColumnGeometry(columnId: string): TableColumnGeometry | undefined {
    if (this.failure) return undefined;
    const index = this.projected.findIndex((column) => column.id === columnId);
    if (index < 0) return undefined;
    const working = this.workingColumns();
    return this.describeColumn(
      this.projected[index],
      index,
      working,
      new Map(working.map((column, index) => [column.id, index])),
    );
  }

  private describeColumn(
    column: ProjectedColumnGeometry,
    index: number,
    working: GeometryColumn[],
    centerIndices: ReadonlyMap<string, number>,
  ): TableColumnGeometry {
    const source = this.columns[column.sourceIndex];
    const centerIndex = centerIndices.get(column.id) ?? -1;
    const isPin = column.region !== 'center';
    const resizeEdge = column.region === 'right' ? 'left' : 'right';
    const bounds = isPin ? this.pinBounds(column.id) : undefined;
    const canShrink = bounds ? column.width > bounds.min + 1e-7 : false;
    const canGrow = bounds ? column.width < bounds.max - 1e-7 : false;
    const directions = isPin
      ? { left: resizeEdge === 'left' ? canGrow : canShrink, right: resizeEdge === 'left' ? canShrink : canGrow }
      : resizeDirections(working, this.layout, this.resizeContainer(), centerIndex);
    return {
      ...column,
      index,
      resizeEdge,
      ...directions,
      ...(isPin ? { resizeBounds: bounds } : {}),
      resizable: source.resizable === true,
      compensator: source.compensator === true,
      measureContent: source.measureContent === true,
    };
  }

  beginResize(id: string, x: number): boolean {
    return this.begin(id, x, 'center', 'right');
  }

  resetColumnWidth(id: string): boolean {
    if (this.failure || this.operation) return false;
    const source = this.columns.find((column) => column.id === id);
    if (!source || source.resizable !== true) return false;
    const pin = this.geometry ? this.pins.get(id) : undefined;
    if (pin) {
      const initial = this.initialPinWidths.get(id);
      if (initial === undefined) return false;
      const target = source.mode === 'auto' ? Math.max(initial, source.floor) : initial;
      const edge = pin.side === 'right' ? 'left' : 'right';
      if (!this.beginPinResize(id, 0, edge)) return false;
      this.moveResize((target - pin.width) * (edge === 'left' ? -1 : 1));
      this.finishResize();
      delete source.manual;
      return true;
    }
    const working = this.workingColumns();
    const index = working.findIndex((column) => column.id === id);
    if (index < 0) return false;
    if (source.mode === 'auto') {
      delete source.manual;
      if (this.geometry) this.centerAnchor = undefined;
      else this.anchor = undefined;
      this.reflow();
      return true;
    }
    const target = this.declarations.get(id)!.width;
    const width = this.layout.widths[index];
    if (!this.beginResize(id, 0)) return false;
    this.moveResize(target - width);
    this.finishResize();
    return true;
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
        const source = this.columns.find((column) => column.id === operation.id)!;
        if (source.resizeFloor !== undefined) source.manual = this.pins.get(operation.id)!.width;
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
    if (
      operation.kind === 'center' &&
      ((column.mode === 'fixed' && column.width !== before.width) ||
        this.layout.base.some((width, index) => Math.abs(width - operation.rollback.layout.base[index]) > 1e-7))
    ) {
      const anchor = { container: this.resizeContainer(), bases: this.layout.base.slice() };
      if (this.geometry) this.centerAnchor = anchor;
      else {
        this.anchor = anchor;
        this.centerAnchor = undefined;
      }
    }
    if (this.applyContentFloors()) this.reflow();
  }

  cancelResize(): void {
    const operation = this.operation;
    if (!operation) return;
    this.operation = undefined;
    this.restore(operation.rollback);
    if (operation.rollback.container === this.resizeContainer() && operation.rollback.pinned === Boolean(this.geometry))
      this.applyCenter(operation.rollback.layout);
    else this.reflow();
    if (this.applyContentFloors()) this.reflow();
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
            minWidth: resizeMinimum(column),
            maxWidth: column.max,
            source:
              column.mode === 'auto'
                ? { mode: 'auto' as const, base: bases.get(column.id)! }
                : { mode: 'fixed' as const, declaredWidth: this.declarations.get(column.id)!.width },
          })),
        );
        this.pins = new Map(next.columns.map((column) => [column.id, column]));
        missing.forEach((column) => this.initialPinWidths.set(column.id, this.pins.get(column.id)!.width));
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
    this.layout = layout;
    const widths = this.widths;
    if (
      widths.length !== this.axis.sizes.length ||
      widths.some((width, index) => Math.abs(width - this.axis.sizes[index]) > 1e-7)
    )
      this.revisionValue++;
    this.axis = new Axis(widths);
  }
}
