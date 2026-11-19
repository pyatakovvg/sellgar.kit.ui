import React from 'react';

import { AddLineIcon, DeleteBinLineIcon, Loader4FillIcon, SubtractLineIcon } from '../../../../icons';

import { Animate } from '../../feedback/animate';

import cn from 'classnames';
import s from './default.module.scss';

interface IProps {
  shape?: 'rounded' | 'pill';
  size?: 'lg' | 'md' | 'sm' | 'xs';
  outline?: boolean;
  leftActionSize?: 'lg' | 'md' | 'sm';
  rightActionSize?: 'lg' | 'md' | 'sm';
  leftActionDisabled?: boolean;
  rightActionDisabled?: boolean;
  leftActionType?: 'add' | 'subtract' | 'delete';
  rightActionType?: 'add' | 'subtract' | 'delete';
  loadingAction?: 'left' | 'right';
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
  loadingAction,
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
          [s['size--sm']]: size === 'sm',
          [s['size--xs']]: size === 'xs',
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
    if (leftActionDisabled || loadingAction) {
      return void 0;
    }
    onLeftActionClick();
  };

  const handleRightActionClick = () => {
    if (rightActionDisabled || loadingAction) {
      return void 0;
    }
    onRightActionClick();
  };

  return (
    <div className={className} aria-busy={Boolean(loadingAction)}>
      <div className={leftActionClassName} onClick={handleLeftActionClick}>
        <div className={s.icon} aria-hidden="true">
          {loadingAction === 'left' ? (
            <Animate.Spin>
              <div className={s.loading}>
                <Loader4FillIcon />
              </div>
            </Animate.Spin>
          ) : leftActionType === 'add' ? (
            <AddLineIcon />
          ) : leftActionType === 'delete' ? (
            <DeleteBinLineIcon />
          ) : (
            <SubtractLineIcon />
          )}
        </div>
      </div>
      <div className={s.value}>{value}</div>
      <div className={rightActionClassName} onClick={handleRightActionClick}>
        <div className={s.icon} aria-hidden="true">
          {loadingAction === 'right' ? (
            <Animate.Spin>
              <div className={s.loading}>
                <Loader4FillIcon />
              </div>
            </Animate.Spin>
          ) : rightActionType === 'add' ? (
            <AddLineIcon />
          ) : rightActionType === 'delete' ? (
            <DeleteBinLineIcon />
          ) : (
            <SubtractLineIcon />
          )}
        </div>
      </div>
    </div>
  );
};
