import React from 'react';

import { Badge } from '../../../status/badge';
import { CloseCircleFillIcon } from '../../../../../icons';

interface IProps {
  label: string | number;
  disabled?: boolean;
  onRemove: () => void;
}

export const SelectedBadge: React.FC<IProps> = (props) => {
  return (
    <Badge
      color={'blue'}
      size={'sm'}
      label={props.label}
      disabled={props.disabled}
      tailIcon={
        props.disabled ? undefined : (
          <CloseCircleFillIcon
            onClick={(event) => {
              event.stopPropagation();
              props.onRemove();
            }}
          />
        )
      }
    />
  );
};
