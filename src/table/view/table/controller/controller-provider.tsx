import React from 'react';

import { SelectionController } from '../../../runtime/selection-controller';
import { SelectionControllerContext } from './context';

export const TableControllerProvider: React.FC<React.PropsWithChildren> = (props) => {
  const [controller] = React.useState(() => new SelectionController());
  return <SelectionControllerContext.Provider value={controller}>{props.children}</SelectionControllerContext.Provider>;
};
