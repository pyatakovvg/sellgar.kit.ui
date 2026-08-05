import React from 'react';

import type { TableColumnId, TableColumnWidths } from '../runtime/types.ts';

export interface TableColumnWidthsAdapter {
  columnWidths: TableColumnWidths;
  setColumnElement(columnId: TableColumnId, element: HTMLElement | null): void;
}

const areColumnWidthsEqual = (left: TableColumnWidths, right: TableColumnWidths): boolean => {
  if (left.size !== right.size) return false;

  for (const [columnId, width] of left) {
    if (right.get(columnId) !== width) return false;
  }

  return true;
};

export const useTableColumnWidths = (): TableColumnWidthsAdapter => {
  const elementsRef = React.useRef(new Map<TableColumnId, HTMLElement>());
  const [elementsVersion, setElementsVersion] = React.useState(0);
  const [columnWidths, setColumnWidths] = React.useState<TableColumnWidths>(() => new Map());

  const setColumnElement = React.useCallback((columnId: TableColumnId, element: HTMLElement | null) => {
    const elements = elementsRef.current;
    const currentElement = elements.get(columnId);

    if (currentElement === element) return;

    if (element) {
      elements.set(columnId, element);
    } else {
      elements.delete(columnId);
    }

    setElementsVersion((version) => version + 1);
  }, []);

  React.useEffect(() => {
    const measure = (): void => {
      const nextColumnWidths = new Map<TableColumnId, number>();

      for (const [columnId, element] of elementsRef.current) {
        const width = element.getBoundingClientRect().width;

        if (width > 0) {
          nextColumnWidths.set(columnId, width);
        }
      }

      setColumnWidths((currentColumnWidths) =>
        areColumnWidthsEqual(currentColumnWidths, nextColumnWidths) ? currentColumnWidths : nextColumnWidths,
      );
    };

    measure();

    if (typeof ResizeObserver === 'undefined') return;

    const resizeObserver = new ResizeObserver(measure);

    for (const element of elementsRef.current.values()) {
      resizeObserver.observe(element);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [elementsVersion]);

  return {
    columnWidths,
    setColumnElement,
  };
};
