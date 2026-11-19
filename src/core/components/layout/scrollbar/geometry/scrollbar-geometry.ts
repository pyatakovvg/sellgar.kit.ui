const CLIPPING_OVERFLOW = /^(auto|scroll|hidden|clip|overlay)$/;

export interface ScrollbarGeometry {
  readonly available: boolean;
  readonly floating: boolean;
}

export const INITIAL_SCROLLBAR_GEOMETRY: ScrollbarGeometry = { available: true, floating: false };

interface ScrollbarBox {
  readonly fixedContainingBlock: boolean;
  readonly position: string;
  readonly element: HTMLElement;
  readonly clipX: boolean;
  readonly clipY: boolean;
  readonly scale: { x: number; y: number };
  readonly borderRight: number;
  readonly borderBottom: number;
  readonly clientLeft: number;
  readonly clientTop: number;
  readonly clientWidth: number;
  readonly clientHeight: number;
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export interface ScrollbarLayout {
  readonly boxes: ReadonlyArray<ScrollbarBox>;
  readonly scrollPositions: Map<EventTarget, { left: number; top: number }>;
  readonly ancestorIds: ReadonlySet<string>;
  readonly visualViewport: { left: number; top: number; right: number; bottom: number };
}

export interface ScrollbarPlacement {
  readonly geometry: ScrollbarGeometry;
  readonly host: HTMLElement | null;
  readonly position: 'absolute' | 'fixed';
  readonly left: number;
  readonly right: number | 'auto';
  readonly bottom: number | 'auto';
  readonly top: number | 'auto';
  readonly width: number | 'auto';
  readonly height: number;
}

export interface ScrollbarTrackMetrics {
  /** Resolved source-root CSS units, measured before portal coordinate conversion. */
  readonly offset: number;
  readonly height: number;
}

export const measureScrollbarTrack = (verticalTrack: HTMLElement): ScrollbarTrackMetrics => {
  const style = window.getComputedStyle(verticalTrack);
  return { offset: Number.parseFloat(style.top) || 0, height: Number.parseFloat(style.width) || 0 };
};

export const getScrollbarAncestors = (root: HTMLElement): HTMLElement[] => {
  const ancestors: HTMLElement[] = [];
  let ancestor = root.parentElement;
  while (ancestor) {
    ancestors.push(ancestor);
    ancestor = ancestor.parentElement;
  }
  return ancestors;
};

export const getElementScale = (element: HTMLElement) => {
  const rect = element.getBoundingClientRect();
  return {
    x: element.offsetWidth > 0 && rect.width > 0 ? rect.width / element.offsetWidth : 1,
    y: element.offsetHeight > 0 && rect.height > 0 ? rect.height / element.offsetHeight : 1,
  };
};

export const measureScrollbarLayout = (ancestors: ReadonlyArray<HTMLElement>): ScrollbarLayout => {
  const visualViewport = window.visualViewport;
  const viewportLeft = visualViewport?.offsetLeft ?? 0;
  const viewportTop = visualViewport?.offsetTop ?? 0;
  const boxes = ancestors.map((element): ScrollbarBox => {
    const style = window.getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return {
      fixedContainingBlock: createsFixedContainingBlock(style),
      position: style.position,
      element,
      clipX:
        element !== document.body && element !== document.documentElement && CLIPPING_OVERFLOW.test(style.overflowX),
      clipY:
        element !== document.body && element !== document.documentElement && CLIPPING_OVERFLOW.test(style.overflowY),
      scale: getElementScale(element),
      borderRight: element.offsetWidth - element.clientWidth - element.clientLeft,
      borderBottom: element.offsetHeight - element.clientHeight - element.clientTop,
      clientLeft: element.clientLeft,
      clientTop: element.clientTop,
      clientWidth: element.clientWidth,
      clientHeight: element.clientHeight,
      left: rect.left,
      top: rect.top,
      right: rect.right,
      bottom: rect.bottom,
    };
  });
  const scrollPositions = new Map<EventTarget, { left: number; top: number }>();
  for (const box of boxes)
    scrollPositions.set(box.element, { left: box.element.scrollLeft, top: box.element.scrollTop });
  scrollPositions.set(document, { left: window.scrollX, top: window.scrollY });
  return {
    boxes,
    scrollPositions,
    ancestorIds: new Set(
      ancestors.flatMap((element) => (element.dataset.scrollbarId ? [element.dataset.scrollbarId] : [])),
    ),
    visualViewport: {
      left: viewportLeft,
      top: viewportTop,
      right: viewportLeft + (visualViewport?.width ?? window.innerWidth),
      bottom: viewportTop + (visualViewport?.height ?? window.innerHeight),
    },
  };
};

// Scrolling changes cached positions by a known translation; it does not require another ancestor layout walk.
export const updateScrollbarLayoutScroll = (layout: ScrollbarLayout, target: EventTarget | null): void => {
  const scrollTarget = target === window ? document : target;
  const previous = scrollTarget ? layout.scrollPositions.get(scrollTarget) : undefined;
  if (!previous) return;
  const left = scrollTarget instanceof HTMLElement ? scrollTarget.scrollLeft : window.scrollX;
  const top = scrollTarget instanceof HTMLElement ? scrollTarget.scrollTop : window.scrollY;
  const box = layout.boxes.find((candidate) => candidate.element === scrollTarget);
  const deltaX = (left - previous.left) * (box?.scale.x ?? 1);
  const deltaY = (top - previous.top) * (box?.scale.y ?? 1);
  previous.left = left;
  previous.top = top;
  for (const candidate of layout.boxes) {
    if (
      scrollTarget === document ||
      (scrollTarget instanceof HTMLElement &&
        candidate.element !== scrollTarget &&
        scrollTarget.contains(candidate.element))
    ) {
      const hasPositionedBoundary = layout.boxes.some(
        (boundary) =>
          (boundary.position === 'fixed' || boundary.position === 'sticky') &&
          boundary.element.contains(candidate.element) &&
          (scrollTarget === document ||
            (scrollTarget instanceof HTMLElement && scrollTarget.contains(boundary.element))),
      );
      if (hasPositionedBoundary) {
        const rect = candidate.element.getBoundingClientRect();
        candidate.left = rect.left;
        candidate.right = rect.right;
        candidate.top = rect.top;
        candidate.bottom = rect.bottom;
        continue;
      }
      candidate.left -= deltaX;
      candidate.right -= deltaX;
      candidate.top -= deltaY;
      candidate.bottom -= deltaY;
    }
  }
};

const createsFixedContainingBlock = (style: CSSStyleDeclaration) => {
  return (
    style.transform !== 'none' ||
    style.perspective !== 'none' ||
    style.filter !== 'none' ||
    style.backdropFilter !== 'none' ||
    /transform|perspective|filter/.test(style.willChange) ||
    /paint|layout|strict|content/.test(style.contain)
  );
};

export const getAncestorHorizontalTracks = (layout: ScrollbarLayout): HTMLElement[] => {
  const tracks: HTMLElement[] = [];
  for (const box of layout.boxes) {
    for (const child of box.element.children) {
      if (
        child instanceof HTMLElement &&
        child.dataset.scrollbarTrack === 'horizontal' &&
        child.dataset.scrollbarOwner &&
        layout.ancestorIds.has(child.dataset.scrollbarOwner) &&
        !tracks.includes(child)
      )
        tracks.push(child);
    }
  }
  return tracks;
};

export const placeScrollbarTrack = (
  root: HTMLElement,
  layout: ScrollbarLayout,
  metrics: ScrollbarTrackMetrics,
): ScrollbarPlacement => {
  const rootRect = root.getBoundingClientRect();
  const rootScale = getElementScale(root);
  const offsetX = metrics.offset * rootScale.x;
  const offsetY = metrics.offset * rootScale.y;
  const trackHeight = metrics.height * rootScale.y;
  let left = Math.max(rootRect.left, layout.visualViewport.left);
  let right = Math.min(rootRect.right, layout.visualViewport.right);
  let top = Math.max(rootRect.top, layout.visualViewport.top);
  let bottom = layout.visualViewport.bottom;
  let bottomBox: ScrollbarBox | undefined;
  for (const box of layout.boxes) {
    if (box.clipX) {
      left = Math.max(left, box.left + box.clientLeft * box.scale.x);
      right = Math.min(right, box.left + (box.clientLeft + box.clientWidth) * box.scale.x);
    }
    if (box.clipY) {
      top = Math.max(top, box.top + box.clientTop * box.scale.y);
      const clipBottom = box.top + (box.clientTop + box.clientHeight) * box.scale.y;
      const preferredEqual =
        Math.abs(clipBottom - bottom) <= 0.5 &&
        ((!!box.element.dataset.scrollbarViewport && !bottomBox?.element.dataset.scrollbarViewport) ||
          (!bottomBox && box.element !== document.body && box.element !== document.documentElement));
      if (clipBottom < bottom - 0.5 || preferredEqual) {
        bottom = clipBottom;
        bottomBox = box;
      }
    }
  }
  let lane = 0;
  for (const track of getAncestorHorizontalTracks(layout)) {
    if (track.dataset.scrollbarAvailable !== 'true') continue;
    const rect = track.getBoundingClientRect();
    if (rect.right > left && rect.left < right && rect.bottom > top && rect.top < bottom)
      lane = Math.max(lane, bottom - rect.top);
  }
  const natural: ScrollbarPlacement = {
    geometry: {
      available:
        root.isConnected &&
        right - left > offsetX * 2 &&
        Math.min(rootRect.bottom, bottom - lane) - top > offsetY * 2 + trackHeight,
      floating: false,
    },
    host: null,
    position: 'absolute',
    left: Math.max(metrics.offset, (left - rootRect.left) / rootScale.x - root.clientLeft + metrics.offset),
    right: Math.max(
      metrics.offset,
      (rootRect.right - right) / rootScale.x - (root.offsetWidth - root.clientWidth - root.clientLeft) + metrics.offset,
    ),
    bottom: metrics.offset,
    top: 'auto',
    width: 'auto',
    height: metrics.height,
  };
  if (!natural.geometry.available || rootRect.bottom <= bottom - lane + 1) return natural;

  const kitHost = bottomBox?.element.dataset.scrollbarViewport
    ? bottomBox.element.parentElement
    : bottomBox?.element.dataset.scrollbarId
      ? bottomBox.element
      : null;
  const host = kitHost ?? bottomBox?.element.parentElement ?? document.body;
  const hostBox = layout.boxes.find((box) => box.element === host);
  const hostScale = hostBox?.scale ?? { x: 1, y: 1 };
  const hostLeft = (hostBox?.left ?? 0) + (hostBox?.clientLeft ?? 0) * hostScale.x;
  if (kitHost && hostBox) {
    return {
      geometry: { available: natural.geometry.available, floating: true },
      host,
      position: 'absolute',
      left: (left - hostLeft + offsetX) / hostScale.x,
      right: 'auto',
      width: (right - left - offsetX * 2) / hostScale.x,
      bottom: (hostBox.bottom - bottom + lane + offsetY) / hostScale.y - hostBox.borderBottom,
      top: 'auto',
      height: trackHeight / hostScale.y,
    };
  }
  const fixedBox = layout.boxes.find(
    (box) => (box.element === host || box.element.contains(host)) && box.fixedContainingBlock,
  );
  const scale = fixedBox?.scale ?? { x: 1, y: 1 };
  return {
    geometry: { available: natural.geometry.available, floating: true },
    host,
    position: 'fixed',
    left: (left - (fixedBox?.left ?? 0) + offsetX) / scale.x - (fixedBox?.clientLeft ?? 0),
    right: 'auto',
    width: (right - left - offsetX * 2) / scale.x,
    bottom: 'auto',
    top: (bottom - lane - (fixedBox?.top ?? 0) - offsetY - trackHeight) / scale.y - (fixedBox?.clientTop ?? 0),
    height: trackHeight / scale.y,
  };
};

export const getHorizontalScrollPosition = (viewport: HTMLElement): number => {
  const maxScroll = Math.max(0, viewport.scrollWidth - viewport.clientWidth);
  if (maxScroll === 0) return 0;
  const position =
    window.getComputedStyle(viewport).direction === 'rtl' ? maxScroll + viewport.scrollLeft : viewport.scrollLeft;
  return Math.min(maxScroll, Math.max(0, position));
};

export const setHorizontalScrollPosition = (viewport: HTMLElement, position: number): void => {
  const maxScroll = Math.max(0, viewport.scrollWidth - viewport.clientWidth);
  const clampedPosition = Math.min(maxScroll, Math.max(0, position));
  viewport.scrollLeft =
    window.getComputedStyle(viewport).direction === 'rtl' ? clampedPosition - maxScroll : clampedPosition;
};
