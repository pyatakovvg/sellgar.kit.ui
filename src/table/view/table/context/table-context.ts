import React from 'react';

import type { TableActionRenderer, TableExpandTriggerProps } from '../../../configurator/types';

import type { TableRowEventTrigger } from '../../../configurator/table-props';
import type { ColumnSortSnapshot } from '../../../runtime/columns/column-sort';
import type { TableLastRowTriggerConfig } from '../../../configurator/table-props';
import type { TableBrowser } from '../../../runtime/browser/table-browser';
import type { TableRuntime } from '../../../runtime/table-runtime';
import type { TableColumnGeometry, TableRowGeometry } from '../../../runtime/types';

export interface TableEnvironment {
  readonly runtime: TableRuntime;
  readonly browser: TableBrowser;
  readonly parentBrowser?: TableBrowser;
  readonly scroll: 'internal' | 'external';
  readonly stickyTop: string;
  readonly className?: string;
  readonly interactive: boolean;
  readonly primaryAction: boolean;
  readonly delayClick: boolean;
  readonly expandable: boolean;
  readonly sort: ColumnSortSnapshot;
  readonly lastRowTrigger?: Omit<TableLastRowTriggerConfig<unknown>, 'onLastRowVisible'>;
  sortable(columnId: string): boolean;
  toggleSort(columnId: string): void;
  lastRowVisible(rowId: string): void;
  readonly headerId: string;
  readonly size: 'sm' | 'md' | 'lg';
  readonly tableStyle: 'primary' | 'secondary';
  readonly surface: 'standalone' | 'embedded';
  align(columnId: string): 'left' | 'center' | 'right' | undefined;
  renderHeader(columnId: string): React.ReactNode;
  headerActions(columnId: string): readonly TableActionRenderer[];
  renderCell(
    row: TableRowGeometry,
    column: TableColumnGeometry,
    expandTrigger: React.FC<TableExpandTriggerProps>,
    treeTrigger: React.FC,
  ): React.ReactNode;
  renderEmpty(): React.ReactNode;
  renderExpanded(rowId: string): React.ReactNode;
  rowEvent(rowId: string, trigger: TableRowEventTrigger, event: React.MouseEvent<HTMLDivElement>): void;
}

export const ExpandedTableContext = React.createContext<TableBrowser | null>(null);

export const TableContext = React.createContext<TableEnvironment | null>(null);

export const useTableEnvironment = (): TableEnvironment => {
  const environment = React.useContext(TableContext);
  if (!environment) throw new Error('Table view requires its instance provider.');
  return environment;
};

export const useTableSnapshot = () => {
  const { runtime } = useTableEnvironment();
  return React.useSyncExternalStore(runtime.subscribe, runtime.getSnapshot, runtime.getSnapshot);
};
