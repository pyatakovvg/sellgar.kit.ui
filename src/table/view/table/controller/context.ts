import React from 'react';

import type { SelectionController } from '../../../runtime/selection-controller';

export const SelectionControllerContext = React.createContext<SelectionController | null>(null);
