import { areSelectionSnapshotsEqual, createInactiveSelectionSnapshot } from './selection';

import type { TableControllerSelectionCommands, TableControllerSelectionSnapshot } from './selection';

type TableControllerListener = () => void;

export class TableControllerStore<T extends object = object> {
  private _tableOwnerId: string | null = null;
  private _selectionSnapshot: TableControllerSelectionSnapshot<T> = createInactiveSelectionSnapshot<T>();
  private _selectionCommands: TableControllerSelectionCommands | null = null;
  private readonly _listeners = new Set<TableControllerListener>();

  subscribe = (listener: TableControllerListener): (() => void) => {
    this._listeners.add(listener);

    return () => {
      this._listeners.delete(listener);
    };
  };

  getSelectionSnapshot = (): TableControllerSelectionSnapshot<T> => {
    return this._selectionSnapshot;
  };

  connectTable(tableOwnerId: string): void {
    if (this._tableOwnerId && this._tableOwnerId !== tableOwnerId) {
      throw new Error('Table.ControllerProvider supports only one Table instance.');
    }

    this._tableOwnerId = tableOwnerId;
  }

  disconnectTable(tableOwnerId: string): void {
    if (this._tableOwnerId !== tableOwnerId) return;

    this._tableOwnerId = null;
    this._selectionCommands = null;
    this.setSelectionSnapshot(createInactiveSelectionSnapshot<T>());
  }

  setSelection(
    tableOwnerId: string,
    snapshot: TableControllerSelectionSnapshot<T>,
    commands: TableControllerSelectionCommands,
  ): void {
    if (this._tableOwnerId && this._tableOwnerId !== tableOwnerId) {
      throw new Error('Table.ControllerProvider supports only one Table instance.');
    }

    this._tableOwnerId = tableOwnerId;
    this._selectionCommands = commands;
    this.setSelectionSnapshot(snapshot);
  }

  clearSelection(): void {
    this._selectionCommands?.clear();
  }

  selectAll(): void {
    this._selectionCommands?.selectAll();
  }

  toggleAllSelection(): void {
    this._selectionCommands?.toggleAll();
  }

  private setSelectionSnapshot(snapshot: TableControllerSelectionSnapshot<T>): void {
    if (areSelectionSnapshotsEqual(this._selectionSnapshot, snapshot)) return;

    this._selectionSnapshot = snapshot;
    this.emit();
  }

  private emit(): void {
    for (const listener of this._listeners) {
      listener();
    }
  }
}
