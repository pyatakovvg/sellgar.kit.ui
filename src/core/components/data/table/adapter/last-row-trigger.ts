import React from 'react';

import type { TableDataLineSnapshot } from '../runtime/types.ts';

export interface TableLastRowTriggerConfig<T> {
  onLastRowVisible(row: T): void;
  rootMargin?: number;
  threshold?: number;
}

interface TableLastRowTriggerInput<T> {
  line: TableDataLineSnapshot<T> | null;
  config?: TableLastRowTriggerConfig<T>;
}

const createRootMargin = (rootMargin: number | undefined, element: HTMLDivElement): string => {
  if (rootMargin != null) return `0px 0px ${rootMargin}px 0px`;

  return `0px 0px ${Math.ceil(element.getBoundingClientRect().height)}px 0px`;
};

export const useTableLastRowTrigger = <T>(input: TableLastRowTriggerInput<T>): React.RefCallback<HTMLDivElement> => {
  const [element, setElement] = React.useState<HTMLDivElement | null>(null);
  const lastTriggeredKeyRef = React.useRef<string | null>(null);
  const onLastRowVisibleRef = React.useRef<TableLastRowTriggerConfig<T>['onLastRowVisible'] | null>(null);
  const line = input.line;
  const isEnabled = Boolean(input.config);
  const triggerKey = line?.id;
  const rootMargin = input.config?.rootMargin;
  const threshold = input.config?.threshold;

  React.useEffect(() => {
    onLastRowVisibleRef.current = input.config?.onLastRowVisible ?? null;
  }, [input.config?.onLastRowVisible]);

  React.useEffect(() => {
    if (!isEnabled || !line || !triggerKey || !element) return;
    if (typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        const firstEntry = entries[0];

        if (!firstEntry?.isIntersecting) return;
        if (lastTriggeredKeyRef.current === triggerKey) return;

        lastTriggeredKeyRef.current = triggerKey;
        onLastRowVisibleRef.current?.(line.node.data);
      },
      {
        root: null,
        rootMargin: createRootMargin(rootMargin, element),
        threshold: threshold ?? 0,
      },
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [element, isEnabled, line, rootMargin, threshold, triggerKey]);

  return React.useCallback((nextElement: HTMLDivElement | null) => {
    setElement(nextElement);
  }, []);
};
