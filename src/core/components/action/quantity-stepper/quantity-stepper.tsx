import React from 'react';

import { AddLineIcon, DeleteBinLineIcon, SubtractLineIcon } from '../../../../icons';

import cn from 'classnames';
import s from './default.module.scss';

interface IProps {
  shape?: 'rounded' | 'pill';
  size?: 'lg' | 'md';
  outline?: boolean;
  leftActionSize?: 'lg' | 'md' | 'sm';
  rightActionSize?: 'lg' | 'md' | 'sm';
  leftActionDisabled?: boolean;
  rightActionDisabled?: boolean;
  leftActionType?: 'add' | 'subtract' | 'delete';
  rightActionType?: 'add' | 'subtract' | 'delete';
  value: number;
  onLeftActionClick(): void;
  onRightActionClick(): void;
}

export const QuantityStepper: React.FC<IProps> = ({
  shape = 'rounded',
  size = 'lg',
  outline = false,
  leftActionDisabled = false,
  rightActionDisabled = false,
  leftActionType = 'subtract',
  rightActionType = 'add',
  value = 0,
  onLeftActionClick,
  onRightActionClick,
}) => {
  const className = React.useMemo(
    () =>
      cn(
        s.wrapper,
        {
          [s['size--lg']]: size === 'lg',
          [s['size--md']]: size === 'md',
        },
        {
          [s['shape--pill']]: shape === 'pill',
          [s['shape--rounded']]: shape === 'rounded',
        },
        {
          [s.outline]: outline,
        },
      ),
    [shape, size, outline],
  );
  const leftActionClassName = React.useMemo(
    () =>
      cn(s['left-action'], {
        [s['disabled']]: leftActionDisabled,
      }),
    [leftActionDisabled],
  );
  const rightActionClassName = React.useMemo(
    () =>
      cn(s['right-action'], {
        [s['disabled']]: rightActionDisabled,
      }),
    [rightActionDisabled],
  );

  const handleLeftActionClick = () => {
    if (leftActionDisabled) {
      return void 0;
    }
    onLeftActionClick();
  };

  const handleRightActionClick = () => {
    if (rightActionDisabled) {
      return void 0;
    }
    onRightActionClick();
  };

  return (
    <div className={className}>
      <div className={leftActionClassName} onClick={handleLeftActionClick}>
        {leftActionType === 'add' && (
          <div className={s.icon}>
            <AddLineIcon />
          </div>
        )}
        {leftActionType === 'delete' && (
          <div className={s.icon}>
            <DeleteBinLineIcon />
          </div>
        )}
        {leftActionType === 'subtract' && (
          <div className={s.icon}>
            <SubtractLineIcon />
          </div>
        )}
      </div>
      <div className={s.value}>{value}</div>
      <div className={rightActionClassName} onClick={handleRightActionClick}>
        {rightActionType === 'add' && (
          <div className={s.icon}>
            <AddLineIcon />
          </div>
        )}
        {rightActionType === 'delete' && (
          <div className={s.icon}>
            <DeleteBinLineIcon />
          </div>
        )}
        {rightActionType === 'subtract' && (
          <div className={s.icon}>
            <SubtractLineIcon />
          </div>
        )}
      </div>
    </div>
  );
};
