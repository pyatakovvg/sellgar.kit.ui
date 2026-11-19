import React from 'react';

import {
  getAncestorHorizontalTracks,
  getScrollbarAncestors,
  INITIAL_SCROLLBAR_GEOMETRY,
  measureScrollbarLayout,
  measureScrollbarTrack,
  placeScrollbarTrack,
  updateScrollbarLayoutScroll,
} from '../geometry';
import type { ScrollbarGeometry, ScrollbarPlacement } from '../geometry';

interface ScrollbarTargets {
  readonly root: React.RefObject<HTMLDivElement | null>;
  readonly viewport: React.RefObject<HTMLDivElement | null>;
  readonly content: React.RefObject<HTMLDivElement | null>;
  readonly horizontalTrack: React.RefObject<HTMLDivElement | null>;
  readonly verticalTrack: React.RefObject<HTMLDivElement | null>;
}

const TRACK_TOKENS = [
  '--numbers-4',
  '--numbers-6',
  '--measurements-radius-full',
  '--background-surface-neutral-subtle',
];

export const useScrollbarGeometry = (
  targets: ScrollbarTargets,
  enabled: boolean,
  onMeasure: (geometry: ScrollbarGeometry) => void,
  onHostChange: () => void,
) => {
  const [portalHost, setPortalHost] = React.useState<HTMLElement | null>(null);
  const hostRef = React.useRef<HTMLElement | null>(null);
  const frameRef = React.useRef<number | null>(null);
  const refreshRef = React.useRef<(() => void) | null>(null);
  const applyRef = React.useRef<(() => void) | null>(null);
  const layoutDirtyRef = React.useRef(true);
  const requestGeometryUpdate = React.useCallback(() => {
    if (frameRef.current != null) return;
    frameRef.current = window.requestAnimationFrame(() => {
      frameRef.current = null;
      refreshRef.current?.();
    });
  }, []);
  const requestLayoutUpdate = React.useCallback(() => {
    layoutDirtyRef.current = true;
    requestGeometryUpdate();
  }, [requestGeometryUpdate]);

  React.useLayoutEffect(() => {
    const root = targets.root.current;
    const viewport = targets.viewport.current;
    const content = targets.content.current;
    const verticalTrack = targets.verticalTrack.current;
    if (!root || !viewport || !content || !verticalTrack) return;

    const ancestors = getScrollbarAncestors(root);
    let layout = measureScrollbarLayout(ancestors);
    let placement: ScrollbarPlacement | null = null;
    let observeAncestorTracks = () => {};
    let tokens = new Map<string, string>();
    let trackMetrics = measureScrollbarTrack(verticalTrack);
    const readTokens = () => {
      const style = window.getComputedStyle(root);
      tokens = new Map(TRACK_TOKENS.map((token) => [token, style.getPropertyValue(token)]));
    };
    readTokens();

    const apply = () => {
      const track = targets.horizontalTrack.current;
      if (
        !track ||
        !placement ||
        placement.host !== hostRef.current ||
        track.parentElement !== (placement.host ?? root)
      )
        return;
      const styles = {
        position: placement.position,
        left: `${placement.left}px`,
        right: placement.right === 'auto' ? 'auto' : `${placement.right}px`,
        bottom: placement.bottom === 'auto' ? 'auto' : `${placement.bottom}px`,
        top: placement.top === 'auto' ? 'auto' : `${placement.top}px`,
        width: placement.width === 'auto' ? 'auto' : `${placement.width}px`,
        height: `${placement.height}px`,
      };
      for (const [property, value] of Object.entries(styles)) {
        if (track.style.getPropertyValue(property) !== value) track.style.setProperty(property, value);
      }
      for (const [token, value] of tokens) {
        if (track.style.getPropertyValue(token) !== value) track.style.setProperty(token, value);
      }
      const floating = String(placement.geometry.floating);
      if (track.dataset.scrollbarFloating !== floating) track.dataset.scrollbarFloating = floating;
      const available = String(placement.geometry.available && viewport.scrollWidth - viewport.clientWidth > 1);
      if (track.dataset.scrollbarAvailable !== available) track.dataset.scrollbarAvailable = available;
      onMeasure(placement.geometry);
    };
    applyRef.current = apply;

    const refresh = () => {
      if (layoutDirtyRef.current) {
        layout = measureScrollbarLayout(ancestors);
        readTokens();
        trackMetrics = measureScrollbarTrack(verticalTrack);
        observeAncestorTracks();
        layoutDirtyRef.current = false;
      }
      placement =
        enabled && viewport.scrollWidth - viewport.clientWidth > 1
          ? placeScrollbarTrack(root, layout, trackMetrics)
          : {
              geometry: INITIAL_SCROLLBAR_GEOMETRY,
              host: null,
              position: 'absolute',
              left: trackMetrics.offset,
              right: trackMetrics.offset,
              bottom: trackMetrics.offset,
              top: 'auto',
              width: 'auto',
              height: trackMetrics.height,
            };
      if (placement.host !== hostRef.current) {
        onHostChange();
        hostRef.current = placement.host;
        setPortalHost(placement.host);
        return;
      }
      apply();
    };
    refreshRef.current = refresh;

    const resizeObserver = new ResizeObserver(requestLayoutUpdate);
    for (const element of [root, viewport, content, verticalTrack, ...ancestors]) resizeObserver.observe(element);
    const mutationObserver = new MutationObserver((records) => {
      let structureChanged = false;
      for (const record of records) {
        if (record.target instanceof Element && record.target.closest('[data-scrollbar-track]')) {
          continue;
        } else structureChanged = true;
      }
      if (structureChanged) requestLayoutUpdate();
    });
    const layoutScope = enabled
      ? (ancestors.find(
          (ancestor) =>
            ancestor !== document.body &&
            ancestor !== document.documentElement &&
            /auto|scroll|hidden|clip|overlay/.test(
              `${window.getComputedStyle(ancestor).overflowX} ${window.getComputedStyle(ancestor).overflowY}`,
            ),
        ) ?? root.parentElement)
      : content;
    const observedLayoutScope =
      layoutScope === document.body || layoutScope === document.documentElement ? content : layoutScope;
    mutationObserver.observe(observedLayoutScope ?? content, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['class', 'style', 'hidden', 'open', 'dir'],
    });
    for (const ancestor of ancestors) {
      if (ancestor !== observedLayoutScope)
        mutationObserver.observe(ancestor, {
          attributes: true,
          childList: true,
          attributeFilter: ['class', 'style', 'hidden', 'dir'],
        });
    }
    const ancestorTrackObserver = new MutationObserver(requestGeometryUpdate);
    observeAncestorTracks = () => {
      ancestorTrackObserver.disconnect();
      if (!enabled) return;
      for (const track of getAncestorHorizontalTracks(layout))
        ancestorTrackObserver.observe(track, {
          attributes: true,
          attributeFilter: ['style', 'data-scrollbar-floating', 'data-scrollbar-available'],
        });
    };
    observeAncestorTracks();
    const handleAncestorScroll = (event: Event) => {
      if (
        event.target === viewport ||
        event.target === document ||
        event.target === window ||
        ancestors.some((ancestor) => ancestor === event.target)
      ) {
        updateScrollbarLayoutScroll(layout, event.target);
        requestGeometryUpdate();
      }
    };
    observedLayoutScope?.addEventListener('load', requestLayoutUpdate, true);
    window.addEventListener('resize', requestLayoutUpdate);
    if (enabled) {
      window.addEventListener('scroll', handleAncestorScroll, { capture: true, passive: true });
      window.visualViewport?.addEventListener('resize', requestLayoutUpdate);
      window.visualViewport?.addEventListener('scroll', requestLayoutUpdate);
    }
    refresh();
    return () => {
      refreshRef.current = null;
      applyRef.current = null;
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      ancestorTrackObserver.disconnect();
      observedLayoutScope?.removeEventListener('load', requestLayoutUpdate, true);
      window.removeEventListener('resize', requestLayoutUpdate);
      window.removeEventListener('scroll', handleAncestorScroll, true);
      window.visualViewport?.removeEventListener('resize', requestLayoutUpdate);
      window.visualViewport?.removeEventListener('scroll', requestLayoutUpdate);
      if (frameRef.current != null) window.cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    };
  }, [
    targets.root,
    targets.viewport,
    targets.content,
    targets.horizontalTrack,
    targets.verticalTrack,
    enabled,
    onMeasure,
    onHostChange,
    requestGeometryUpdate,
    requestLayoutUpdate,
  ]);

  React.useLayoutEffect(() => {
    applyRef.current?.();
  }, [portalHost]);
  return { requestGeometryUpdate, portalHost };
};
