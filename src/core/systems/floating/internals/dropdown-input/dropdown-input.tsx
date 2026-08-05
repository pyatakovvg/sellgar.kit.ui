import React from 'react';

import { ArrowDropDownLineIcon, ArrowDropUpLineIcon, CloseLineIcon } from '../../../../../icons';

import cn from 'classnames';
import s from './default.module.scss';

export interface IProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'className'> {
  ref?: React.RefCallback<HTMLInputElement>;
  target?: 'destructive';
  isOpen?: boolean;
  isClearable?: boolean;
  fixHeight?: boolean;
  onClear?(): void;
}

export const DropdownInput: React.FC<React.PropsWithChildren<IProps>> = ({
  children,
  target,
  isOpen,
  isClearable,
  disabled,
  onClear,
}) => {
  const className = React.useMemo(
    () =>
      cn(
        s.wrapper,
        {
          [s['disabled']]: disabled,
        },
        {
          [s['destructive']]: target === 'destructive',
        },
      ),
    [target, disabled],
  );

  const handleClearable = (event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();

    onClear && onClear();
  };

  return (
    <div className={className}>
      <div className={s.content}>{children}</div>
      {isClearable && (
        <div className={s.clearable} onClick={handleClearable}>
          <CloseLineIcon />
        </div>
      )}
      <div className={s.arrow}>{isOpen ? <ArrowDropUpLineIcon /> : <ArrowDropDownLineIcon />}</div>
    </div>
  );
};
