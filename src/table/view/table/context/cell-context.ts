import React from 'react';

export interface TableCellData<T = unknown> {
  readonly id: string;
  readonly data: T;
  /** Прежнее имя глубины дерева для совместимости потомков ячейки. */
  readonly deps: number;
}

interface CellContextValue extends TableCellData {
  readonly expanded: boolean;
  onToggle(): void;
}

export const CellContext = React.createContext<CellContextValue | null>(null);

export const useCellData = <T = unknown>(source?: string): TableCellData<T> => {
  const context = React.useContext(CellContext);
  if (!context) {
    console.warn(
      `Table cell data context is not available${source ? ` (${source})` : ''}. Ensure hook is used inside Table.Cell.`,
    );
    return { id: '', data: undefined as T, deps: 0 };
  }
  // Provider стирает generic строки; публичный hook восстанавливает тип потребителя.
  return { id: context.id, data: context.data as T, deps: context.deps };
};

export const useRowExpanded = () => {
  const context = React.useContext(CellContext);
  if (!context) {
    console.warn('Table row expand context is not available. Ensure hook is used inside Table.Cell.');
    return { expanded: false, onToggle: () => {} };
  }
  return { expanded: context.expanded, onToggle: context.onToggle };
};
