import React from 'react';

import { Control } from './control';

import cn from 'classnames';
import s from './default.module.scss';

interface IProps {
  label: React.ReactNode;
  leadSlot1?: React.ReactNode;
  leadSlot2?: React.ReactNode;
  size?: 'lg' | 'md';
  radius?: 'lg' | 'xxl';
  description?: React.ReactNode;
  tabIndex?: number;
  defaultState?: boolean;
  expanded?: boolean;
  onState?: (expanded: boolean) => void;
}

export const Accordion: React.FC<React.PropsWithChildren<IProps>> = ({ radius = 'lg', size = 'lg', ...props }) => {
  const [uncontrolledExpanded, setUncontrolledExpanded] = React.useState(() => props.defaultState ?? false);
  const isExpanded = props.expanded ?? uncontrolledExpanded;
  const isControlled = props.expanded !== void 0;
  const hasLeadSlots = Boolean(props.leadSlot1 || props.leadSlot2);
  const className = React.useMemo(
    () =>
      cn(
        s.wrapper,
        {
          [s.expanded]: isExpanded,
          [s['has-lead-slots']]: hasLeadSlots,
        },
        {
          [s['size--large']]: size === 'lg',
          [s['size--medium']]: size === 'md',
        },
        {
          [s['radius--large']]: radius === 'lg',
          [s['radius--extra-large']]: radius === 'xxl',
        },
      ),
    [hasLeadSlots, isExpanded, radius, size],
  );

  const handleExpand = () => {
    const nextExpanded = !isExpanded;

    if (!isControlled) {
      setUncontrolledExpanded(nextExpanded);
    }

    props.onState && props.onState(nextExpanded);
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }

    event.preventDefault();
    handleExpand();
  };

  const stopContentPropagation = (
    event: React.SyntheticEvent<HTMLDivElement>,
  ) => {
    event.stopPropagation();
  };

  return (
    <div
      className={className}
      tabIndex={props.tabIndex ?? 0}
      role={'button'}
      aria-expanded={isExpanded}
      onClick={handleExpand}
      onKeyDown={handleKeyDown}
    >
      {hasLeadSlots && (
        <div
          className={s['lead-slots']}
          onClick={stopContentPropagation}
          onKeyDown={stopContentPropagation}
        >
          {props.leadSlot1 && (
            <div className={s['lead-slot']}>{props.leadSlot1}</div>
          )}
          {props.leadSlot2 && (
            <div className={s['lead-slot']}>{props.leadSlot2}</div>
          )}
        </div>
      )}
      <div className={s.header}>
        <Control isExpanded={isExpanded} label={props.label} />
      </div>
      {isExpanded && props.description && (
        <div
          className={s.description}
          onClick={stopContentPropagation}
          onKeyDown={stopContentPropagation}
        >
          {props.description}
        </div>
      )}
      {isExpanded && props.children && (
        <div
          className={s.slot}
          onClick={stopContentPropagation}
          onKeyDown={stopContentPropagation}
        >
          {props.children}
        </div>
      )}
    </div>
  );
};
