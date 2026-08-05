import React from 'react';

export const getCssSize = (value: number | string): string => {
  if (typeof value === 'number') {
    return `${value}px`;
  }

  return value;
};

export const mergeRefs = <TElement,>(
  ...refs: readonly (React.Ref<TElement> | undefined)[]
): React.RefCallback<TElement> => {
  return (node) => {
    for (const ref of refs) {
      if (ref === void 0 || ref === null) {
        continue;
      }

      if (typeof ref === 'function') {
        ref(node);
        continue;
      }

      ref.current = node;
    }
  };
};

export const mergeEventHandlers = <TEvent,>(
  first: ((event: TEvent) => void) | undefined,
  second: ((event: TEvent) => void) | undefined,
): ((event: TEvent) => void) | undefined => {
  if (first === void 0) {
    return second;
  }

  if (second === void 0) {
    return first;
  }

  return (event) => {
    first(event);
    second(event);
  };
};

export const isRenderFunction = <TState,>(
  children: React.ReactNode | ((state: TState) => React.ReactNode),
): children is (state: TState) => React.ReactNode => {
  return typeof children === 'function';
};
