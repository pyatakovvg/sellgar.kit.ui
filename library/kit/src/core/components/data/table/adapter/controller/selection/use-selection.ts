import React from 'react';

import { useTableController } from '../context.ts';

import type { TableControllerSelection, TableControllerSelectionSnapshot } from './types.ts';

export const useTableControllerSelection = <T extends object = object>(): TableControllerSelection<T> => {
  const controller = useTableController();
  const snapshot = React.useSyncExternalStore(
    controller.subscribe,
    controller.getSelectionSnapshot,
    controller.getSelectionSnapshot,
  ) as TableControllerSelectionSnapshot<T>;

  return React.useMemo(
    () => ({
      ...snapshot,
      clear: () => controller.clearSelection(),
      selectAll: () => controller.selectAll(),
      toggleAll: () => controller.toggleAllSelection(),
    }),
    [controller, snapshot],
  );
};
