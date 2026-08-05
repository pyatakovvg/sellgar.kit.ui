import React from 'react';

import { Checkbox } from '../../checkbox';
import { Badge } from '../../../status/badge';
import { Typography } from '../../../content/typography';

import cn from 'classnames';
import s from './default.module.scss';

export interface IProps {
  title: string;
  checked: boolean;
  isIndeterminate?: boolean;
  badge?: string | number;
  disabled?: boolean;
}

export const Option: React.FC<IProps> = (props) => {
  const className = React.useMemo(
    () =>
      cn(s.wrapper, {
        [s.disabled]: props.disabled,
      }),
    [props.disabled],
  );

  return (
    <div className={className} data-qa={'multi-select.option'}>
      <Checkbox
        checked={props.checked}
        data-qa={'multi-select.option-checkbox'}
        isIndeterminate={props.isIndeterminate}
        readOnly
        disabled={props.disabled}
      />
      <Typography size={'caption-l'} weight={'medium'}>
        <p className={s.text} data-qa={'multi-select.option-text'}>
          {props.title}
        </p>
      </Typography>
      {!!props.badge ? <Badge label={props.badge} size={'xs'} /> : null}
    </div>
  );
};
