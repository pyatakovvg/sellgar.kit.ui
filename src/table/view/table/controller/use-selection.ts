import React from 'react';

import { SelectionControllerContext } from './context';

import type { SelectionSnapshot } from '../../../runtime/selection';

export const useTableControllerSelection = <T extends object = object>() => {
  const controller = React.useContext(SelectionControllerContext);
  if (!controller) throw new Error('useTableControllerSelection requires Table.ControllerProvider.');
  const snapshot = React.useSyncExternalStore(controller.subscribe, controller.getSnapshot, controller.getSnapshot);
  return React.useMemo(
    () => ({
      ...(snapshot as SelectionSnapshot<T>),
      clear: controller.clear,
      selectAll: controller.selectAll,
      toggleAll: controller.toggleAll,
    }),
    [controller, snapshot],
  );
};
