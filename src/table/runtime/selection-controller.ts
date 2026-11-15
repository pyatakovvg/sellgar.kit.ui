import { EMPTY_SELECTION_SNAPSHOT } from './selection.ts';

import type { SelectionRuntime, SelectionSnapshot } from './selection.ts';

type SelectionSource = Pick<SelectionRuntime, 'subscribe' | 'getSnapshot' | 'clear' | 'selectAll' | 'toggleAll'>;

/** A controller is a connection to one table, never another owner of its state. */
export class SelectionController {
  private source: SelectionSource | null = null;
  private readonly listeners = new Set<() => void>();

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  getSnapshot = (): SelectionSnapshot => this.source?.getSnapshot() ?? EMPTY_SELECTION_SNAPSHOT;

  clear = (): void => {
    this.source?.clear();
  };
  selectAll = (): void => {
    this.source?.selectAll();
  };
  toggleAll = (): void => {
    this.source?.toggleAll();
  };

  connect(source: SelectionSource): () => void {
    if (this.source) throw new Error('Table.ControllerProvider supports only one Table instance.');
    this.source = source;
    const unsubscribe = source.subscribe(this.notify);
    this.notify();
    return () => {
      unsubscribe();
      if (this.source !== source) return;
      this.source = null;
      this.notify();
    };
  }

  private notify = (): void => {
    for (const listener of this.listeners) listener();
  };
}
