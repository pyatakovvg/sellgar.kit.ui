import React from 'react';

const DEFAULT_VIEWPORT_HEIGHT = 600;
const TABLE_HEADER_ESTIMATED_HEIGHT = 48;

export interface TableVirtualLinesConfig {
  enabled: boolean;
  lineCount: number;
  rowHeight: number;
  overscan: number;
  scrollMode: 'internal' | 'external';
  contentRef: React.RefObject<HTMLDivElement | null>;
}

export interface TableVirtualLinesSnapshot {
  enabled: boolean;
  startIndex: number;
  endIndex: number;
  topSpacerHeight: number;
  bottomSpacerHeight: number;
  onScroll(event: React.UIEvent<HTMLDivElement>): void;
}

interface TableVirtualViewport {
  scrollTop: number;
  height: number;
}

const createViewport = (scrollTop: number, height: number): TableVirtualViewport => ({
  scrollTop: Math.max(scrollTop, 0),
  height: Math.max(height, 0),
});

const isViewportEqual = (left: TableVirtualViewport, right: TableVirtualViewport): boolean => {
  return left.scrollTop === right.scrollTop && left.height === right.height;
};

export const useTableVirtualLines = (config: TableVirtualLinesConfig): TableVirtualLinesSnapshot => {
  const [viewport, setViewport] = React.useState<TableVirtualViewport>(() =>
    createViewport(0, DEFAULT_VIEWPORT_HEIGHT),
  );

  const updateViewport = React.useCallback((nextViewport: TableVirtualViewport) => {
    setViewport((previousViewport) =>
      isViewportEqual(previousViewport, nextViewport) ? previousViewport : nextViewport,
    );
  }, []);

  const handleScroll = React.useCallback(
    (event: React.UIEvent<HTMLDivElement>) => {
      if (!config.enabled || config.scrollMode !== 'internal') return;

      updateViewport(
        createViewport(event.currentTarget.scrollTop - TABLE_HEADER_ESTIMATED_HEIGHT, event.currentTarget.clientHeight),
      );
    },
    [config.enabled, config.scrollMode, updateViewport],
  );

  React.useEffect(() => {
    if (!config.enabled || config.scrollMode !== 'external') return void 0;

    const updateExternalViewport = () => {
      const content = config.contentRef.current;

      if (!content) return;

      const rect = content.getBoundingClientRect();

      updateViewport(createViewport(-rect.top - TABLE_HEADER_ESTIMATED_HEIGHT, window.innerHeight));
    };

    updateExternalViewport();
    window.addEventListener('scroll', updateExternalViewport, { passive: true });
    window.addEventListener('resize', updateExternalViewport);

    return () => {
      window.removeEventListener('scroll', updateExternalViewport);
      window.removeEventListener('resize', updateExternalViewport);
    };
  }, [config.contentRef, config.enabled, config.scrollMode, updateViewport]);

  const visibleCount = Math.ceil(viewport.height / config.rowHeight);
  const startIndex = Math.max(Math.floor(viewport.scrollTop / config.rowHeight) - config.overscan, 0);
  const endIndex = Math.min(startIndex + visibleCount + config.overscan * 2, config.lineCount);

  return {
    enabled: config.enabled,
    startIndex,
    endIndex,
    topSpacerHeight: startIndex * config.rowHeight,
    bottomSpacerHeight: Math.max(config.lineCount - endIndex, 0) * config.rowHeight,
    onScroll: handleScroll,
  };
};
