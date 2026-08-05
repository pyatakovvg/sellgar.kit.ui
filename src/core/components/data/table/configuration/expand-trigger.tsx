import React from 'react';

import { useTableExpandTriggerContext } from '../view/expand-trigger-context.ts';

export interface TableExpandTriggerRenderState {
  expanded: boolean;
}

export interface TableExpandTriggerProps {
  children: React.ReactNode | ((state: TableExpandTriggerRenderState) => React.ReactNode);
}

export const ExpandTrigger = (props: TableExpandTriggerProps) => {
  const context = useTableExpandTriggerContext();

  if (!context) {
    return <>{typeof props.children === 'function' ? props.children({ expanded: false }) : props.children}</>;
  }

  const handleToggle = (event: React.MouseEvent<HTMLElement> | React.KeyboardEvent<HTMLElement>) => {
    event.stopPropagation();
    context.toggle();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;

    event.preventDefault();
    handleToggle(event);
  };

  return (
    <span
      role="button"
      tabIndex={0}
      aria-expanded={context.expanded}
      data-row-event-ignore=""
      data-expanded={context.expanded ? '' : undefined}
      style={{ display: 'contents' }}
      onClick={handleToggle}
      onKeyDown={handleKeyDown}
    >
      {typeof props.children === 'function' ? props.children({ expanded: context.expanded }) : props.children}
    </span>
  );
};
ExpandTrigger.displayName = 'TableExpandTrigger';
