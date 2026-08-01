export interface TableControllerSelectionSnapshot<T extends object = object> {
  ready: boolean;
  enabled: boolean;
  rows: readonly T[];
  selectedCount: number;
  allSelected: boolean;
  indeterminate: boolean;
  canClear: boolean;
  canSelectAll: boolean;
}

export interface TableControllerSelectionCommands {
  clear(): void;
  selectAll(): void;
  toggleAll(): void;
}

export interface TableControllerSelection<T extends object = object>
  extends TableControllerSelectionSnapshot<T>, TableControllerSelectionCommands {}
