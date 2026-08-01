import React from 'react';

import { Checkbox } from '../../../..';

interface TableSelectionCheckboxViewProps {
  checked: boolean;
  isIndeterminate?: boolean;
  ariaLabel: string;
  onChange(): void;
}

export const TableSelectionCheckboxView: React.FC<TableSelectionCheckboxViewProps> = (props) => {
  const stateKey = props.isIndeterminate ? 'mixed' : props.checked ? 'checked' : 'unchecked';

  return (
    <Checkbox
      key={stateKey}
      size="sm"
      checked={props.checked}
      isIndeterminate={props.isIndeterminate}
      aria-label={props.ariaLabel}
      onChange={props.onChange}
    />
  );
};
