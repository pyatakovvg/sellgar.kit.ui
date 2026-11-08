import React from 'react';
import { createPortal } from 'react-dom';

import {
  getElementScale,
  getHorizontalScrollPosition,
  INITIAL_SCROLLBAR_GEOMETRY,
  setHorizontalScrollPosition,
} from './geometry';
import type { ScrollbarGeometry } from './geometry';
import { useScrollbarGeometry } from './hooks';
import { ThumbMotion } from './thumb-motion';

import cn from 'classnames';
import s from './default.module.scss';

const MIN_THUMB_SIZE = 24;
const HIDE_DELAY_MS = 700;
const TRACK_OFFSET = 6;

interface IThumbState {
  readonly isVisible: boolean;
  readonly offset: number;
  readonly size: number;
}

interface IScrollbarState {
  readonly horizontal: boolean;
  readonly isHorizontalFloating: boolean;
  readonly isAwake: boolean;
  readonly vertical: boolean;
}

interface IDragState {
  readonly axis: 'horizontal' | 'vertical';
  readonly pointerPosition: number;
  readonly scrollPosition: number;
  readonly scrollSize: number;
  readonly thumbSize: number;
  readonly trackSize: number;
  readonly viewportSize: number;
  readonly captureElement: HTMLDivElement;
  readonly pointerId: number;
  readonly pointerScale: number;
}

interface IProps extends React.HTMLAttributes<HTMLDivElement> {
  floatingHorizontalScrollbar?: boolean;
}

const initialThumbState: IThumbState = {
  isVisible: false,
  offset: 0,
  size: 0,
};

const initialState: IScrollbarState = {
  horizontal: false,
  isHorizontalFloating: false,
  isAwake: false,
  vertical: false,
};

const getThumbState = (
  viewportSize: number,
  scrollSize: number,
  scrollPosition: number,
  trackSize: number,
): IThumbState => {
  const maxScroll = scrollSize - viewportSize;

  if (maxScroll <= 1 || trackSize <= 0) {
    return initialThumbState;
  }

  const size = Math.min(trackSize, Math.max(MIN_THUMB_SIZE, (viewportSize / scrollSize) * trackSize));
  const maxOffset = trackSize - size;
  const offset = maxOffset <= 0 ? 0 : (scrollPosition / maxScroll) * maxOffset;

  return {
    isVisible: true,
    offset,
    size,
  };
};

const createThumbs = (
  viewport: HTMLDivElement,
  horizontalTrack: HTMLDivElement,
  geometry: ScrollbarGeometry,
): { horizontal: IThumbState; vertical: IThumbState } => {
  const verticalTrackSize = Math.max(0, viewport.clientHeight - TRACK_OFFSET * 2);
  const horizontalTrackSize = horizontalTrack.clientWidth;

  return {
    horizontal: geometry.available
      ? getThumbState(
          viewport.clientWidth,
          viewport.scrollWidth,
          getHorizontalScrollPosition(viewport),
          horizontalTrackSize,
        )
      : initialThumbState,
    vertical: getThumbState(viewport.clientHeight, viewport.scrollHeight, viewport.scrollTop, verticalTrackSize),
  };
};

const isStateEqual = (left: IScrollbarState, right: IScrollbarState) => {
  return (
    left.isAwake === right.isAwake &&
    left.isHorizontalFloating === right.isHorizontalFloating &&
    left.vertical === right.vertical &&
    left.horizontal === right.horizontal
  );
};

const mergeRefs = <TElement,>(...refs: ReadonlyArray<React.ForwardedRef<TElement> | undefined>) => {
  return (element: TElement | null) => {
    for (const ref of refs) {
      if (!ref) {
        continue;
      }

      if (typeof ref === 'function') {
        ref(element);
        continue;
      }

      ref.current = element;
    }
  };
};

const getPointerPosition = (event: PointerEvent | React.PointerEvent<HTMLElement>, axis: IDragState['axis']) => {
  return axis === 'vertical' ? event.clientY : event.clientX;
};

const getScrollPosition = (viewport: HTMLDivElement, axis: IDragState['axis']) => {
  return axis === 'vertical' ? viewport.scrollTop : getHorizontalScrollPosition(viewport);
};

const getScrollSize = (viewport: HTMLDivElement, axis: IDragState['axis']) => {
  return axis === 'vertical' ? viewport.scrollHeight : viewport.scrollWidth;
};

const getViewportSize = (viewport: HTMLDivElement, axis: IDragState['axis']) => {
  return axis === 'vertical' ? viewport.clientHeight : viewport.clientWidth;
};

const getTrackSize = (track: HTMLDivElement, axis: IDragState['axis']) => {
  return axis === 'vertical' ? track.clientHeight : track.clientWidth;
};

const getPointerScale = (track: HTMLDivElement, axis: IDragState['axis']) => {
  const scale = getElementScale(track);
  return axis === 'vertical' ? scale.y : scale.x;
};

const setScrollPosition = (viewport: HTMLDivElement, axis: IDragState['axis'], value: number) => {
  if (axis === 'vertical') {
    viewport.scrollTop = value;
    return;
  }

  setHorizontalScrollPosition(viewport, value);
};

const scrollFocusedElementIntoViewport = (viewport: HTMLDivElement, element: HTMLElement): boolean => {
  const viewportRect = viewport.getBoundingClientRect();
  const elementRect = element.getBoundingClientRect();
  const previousScrollTop = viewport.scrollTop;
  const previousScrollLeft = viewport.scrollLeft;
  let nextScrollTop = viewport.scrollTop;
  let nextScrollLeft = viewport.scrollLeft;

  if (elementRect.top < viewportRect.top) {
    nextScrollTop -= viewportRect.top - elementRect.top;
  } else if (elementRect.bottom > viewportRect.bottom) {
    nextScrollTop += elementRect.bottom - viewportRect.bottom;
  }

  if (elementRect.left < viewportRect.left) {
    nextScrollLeft -= viewportRect.left - elementRect.left;
  } else if (elementRect.right > viewportRect.right) {
    nextScrollLeft += elementRect.right - viewportRect.right;
  }

  viewport.scrollTop = nextScrollTop;
  viewport.scrollLeft = nextScrollLeft;

  return viewport.scrollTop !== previousScrollTop || viewport.scrollLeft !== previousScrollLeft;
};

export const Scrollbar = React.forwardRef<HTMLDivElement, IProps>(
  (
    {
      children,
      className,
      floatingHorizontalScrollbar = true,
      onFocusCapture,
      onMouseEnter,
      onMouseLeave,
      onPointerDown,
      onScroll,
      ...props
    },
    ref,
  ) => {
    const scrollbarId = React.useId();
    const rootRef = React.useRef<HTMLDivElement>(null);
    const viewportRef = React.useRef<HTMLDivElement>(null);
    const contentRef = React.useRef<HTMLDivElement>(null);
    const verticalTrackRef = React.useRef<HTMLDivElement>(null);
    const horizontalTrackRef = React.useRef<HTMLDivElement>(null);
    const horizontalThumbRef = React.useRef<HTMLDivElement>(null);
    const verticalThumbRef = React.useRef<HTMLDivElement>(null);
    const thumbsRef = React.useRef({ horizontal: initialThumbState, vertical: initialThumbState });
    const [thumbMotion] = React.useState(() => new ThumbMotion());
    const hideTimerRef = React.useRef<number | null>(null);
    const focusFrameRef = React.useRef<number | null>(null);
    const dragStateRef = React.useRef<IDragState | null>(null);
    const geometryRef = React.useRef<ScrollbarGeometry>(INITIAL_SCROLLBAR_GEOMETRY);
    const awakeRef = React.useRef(false);
    const [state, setState] = React.useState<IScrollbarState>(initialState);

    const clearHideTimer = React.useCallback(() => {
      if (hideTimerRef.current == null) {
        return;
      }

      window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }, []);

    const updateState = React.useCallback(
      (isAwake: boolean) => {
        const viewport = viewportRef.current;
        const horizontalTrack = horizontalTrackRef.current;

        if (!viewport || !horizontalTrack) {
          return;
        }

        awakeRef.current = isAwake;
        const thumbs = createThumbs(viewport, horizontalTrack, geometryRef.current);
        thumbsRef.current = thumbs;
        if (horizontalThumbRef.current)
          thumbMotion.sync(horizontalThumbRef.current, viewport, 'horizontal', thumbs.horizontal);
        if (verticalThumbRef.current) thumbMotion.sync(verticalThumbRef.current, viewport, 'vertical', thumbs.vertical);
        const nextState: IScrollbarState = {
          horizontal: thumbs.horizontal.isVisible,
          vertical: thumbs.vertical.isVisible,
          isAwake,
          isHorizontalFloating: geometryRef.current.floating,
        };

        setState((previousState) => (isStateEqual(previousState, nextState) ? previousState : nextState));
      },
      [thumbMotion],
    );

    const cancelDrag = React.useCallback(() => {
      const dragState = dragStateRef.current;
      if (!dragState) return;

      dragStateRef.current = null;
      if (dragState.captureElement.hasPointerCapture(dragState.pointerId)) {
        dragState.captureElement.releasePointerCapture(dragState.pointerId);
      }
    }, []);

    const handleGeometryMeasure = React.useCallback(
      (geometry: ScrollbarGeometry) => {
        geometryRef.current = geometry;
        const viewport = viewportRef.current;
        const dragState = dragStateRef.current;
        const track = dragState?.axis === 'vertical' ? verticalTrackRef.current : horizontalTrackRef.current;

        if (
          dragState &&
          viewport &&
          track &&
          (!viewport.isConnected ||
            !geometry.available ||
            dragState.scrollSize !== getScrollSize(viewport, dragState.axis) ||
            dragState.viewportSize !== getViewportSize(viewport, dragState.axis) ||
            dragState.trackSize !== getTrackSize(track, dragState.axis) ||
            Math.abs(dragState.pointerScale - getPointerScale(track, dragState.axis)) > 0.001)
        )
          cancelDrag();

        updateState(awakeRef.current);
      },
      [cancelDrag, updateState],
    );

    const { requestGeometryUpdate, portalHost } = useScrollbarGeometry(
      {
        root: rootRef,
        viewport: viewportRef,
        content: contentRef,
        horizontalTrack: horizontalTrackRef,
      },
      floatingHorizontalScrollbar,
      handleGeometryMeasure,
      cancelDrag,
    );

    const scheduleHide = React.useCallback(() => {
      clearHideTimer();
      if (dragStateRef.current) return;

      hideTimerRef.current = window.setTimeout(() => {
        hideTimerRef.current = null;
        if (dragStateRef.current) return;
        updateState(false);
      }, HIDE_DELAY_MS);
    }, [clearHideTimer, updateState]);

    const wake = React.useCallback(() => {
      clearHideTimer();
      updateState(true);
    }, [clearHideTimer, updateState]);

    React.useEffect(() => {
      return () => {
        clearHideTimer();
        cancelDrag();

        if (focusFrameRef.current != null) {
          window.cancelAnimationFrame(focusFrameRef.current);
        }
      };
    }, [cancelDrag, clearHideTimer]);

    React.useEffect(() => {
      const handlePointerMove = (event: PointerEvent) => {
        const viewport = viewportRef.current;
        const dragState = dragStateRef.current;

        if (!viewport || !dragState || event.pointerId !== dragState.pointerId) {
          return;
        }

        const track = dragState.axis === 'vertical' ? verticalTrackRef.current : horizontalTrackRef.current;
        if (
          !viewport.isConnected ||
          !track ||
          dragState.scrollSize !== getScrollSize(viewport, dragState.axis) ||
          dragState.viewportSize !== getViewportSize(viewport, dragState.axis) ||
          dragState.trackSize !== getTrackSize(track, dragState.axis) ||
          Math.abs(dragState.pointerScale - getPointerScale(track, dragState.axis)) > 0.001
        ) {
          cancelDrag();
          return;
        }

        const maxScroll = dragState.scrollSize - dragState.viewportSize;
        const maxThumbOffset = dragState.trackSize - dragState.thumbSize;

        if (maxScroll <= 0 || maxThumbOffset <= 0) {
          return;
        }

        const pointerDelta =
          (getPointerPosition(event, dragState.axis) - dragState.pointerPosition) / dragState.pointerScale;
        const scrollDelta = (pointerDelta / maxThumbOffset) * maxScroll;

        setScrollPosition(viewport, dragState.axis, dragState.scrollPosition + scrollDelta);
        updateState(true);
      };

      const handlePointerUp = (event: PointerEvent) => {
        if (!dragStateRef.current || event.pointerId !== dragStateRef.current.pointerId) {
          return;
        }

        cancelDrag();
        scheduleHide();
      };

      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
      window.addEventListener('pointercancel', handlePointerUp);

      return () => {
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', handlePointerUp);
        window.removeEventListener('pointercancel', handlePointerUp);
      };
    }, [cancelDrag, scheduleHide, updateState]);

    const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
      onScroll?.(event);
    };

    React.useLayoutEffect(() => {
      const viewport = viewportRef.current;
      if (!viewport) return;
      const scroll = () => {
        wake();
        scheduleHide();
        requestGeometryUpdate();
      };
      viewport.addEventListener('scroll', scroll, { passive: true });
      return () => viewport.removeEventListener('scroll', scroll);
    }, [wake, scheduleHide, requestGeometryUpdate]);

    React.useLayoutEffect(() => {
      const viewport = viewportRef.current;
      if (!viewport) return;
      if (horizontalThumbRef.current)
        thumbMotion.sync(horizontalThumbRef.current, viewport, 'horizontal', thumbsRef.current.horizontal);
      if (verticalThumbRef.current)
        thumbMotion.sync(verticalThumbRef.current, viewport, 'vertical', thumbsRef.current.vertical);
    });
    React.useEffect(() => () => thumbMotion.clear(), [thumbMotion]);

    const handleMouseEnter = (event: React.MouseEvent<HTMLDivElement>) => {
      onMouseEnter?.(event);
      wake();
    };

    const handleMouseLeave = (event: React.MouseEvent<HTMLDivElement>) => {
      onMouseLeave?.(event);

      if (!dragStateRef.current) {
        scheduleHide();
      }
    };

    const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
      onPointerDown?.(event);
      wake();
    };

    const handleFocusCapture = (event: React.FocusEvent<HTMLDivElement>) => {
      onFocusCapture?.(event);

      const viewport = viewportRef.current;
      const target = event.target;

      if (!viewport || !(target instanceof HTMLElement) || !viewport.contains(target)) {
        return;
      }

      if (focusFrameRef.current != null) {
        window.cancelAnimationFrame(focusFrameRef.current);
      }

      focusFrameRef.current = window.requestAnimationFrame(() => {
        focusFrameRef.current = null;

        if (!viewport.isConnected || !target.isConnected || !viewport.contains(target)) {
          return;
        }

        if (scrollFocusedElementIntoViewport(viewport, target)) {
          updateState(true);
          scheduleHide();
        }
      });
    };

    const handleThumbPointerDown = (event: React.PointerEvent<HTMLDivElement>, axis: IDragState['axis']) => {
      if (event.button !== 0 || dragStateRef.current) return;
      const viewport = viewportRef.current;
      const track = axis === 'vertical' ? verticalTrackRef.current : horizontalTrackRef.current;

      if (!viewport || !track) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      event.currentTarget.setPointerCapture(event.pointerId);
      wake();
      const thumb = thumbsRef.current[axis];

      dragStateRef.current = {
        axis,
        pointerPosition: getPointerPosition(event, axis),
        scrollPosition: getScrollPosition(viewport, axis),
        scrollSize: getScrollSize(viewport, axis),
        thumbSize: thumb.size,
        trackSize: getTrackSize(track, axis),
        viewportSize: getViewportSize(viewport, axis),
        captureElement: event.currentTarget,
        pointerId: event.pointerId,
        pointerScale: getPointerScale(track, axis),
      };
    };

    const handleTrackPointerDown = (event: React.PointerEvent<HTMLDivElement>, axis: IDragState['axis']) => {
      if (event.button !== 0 || dragStateRef.current) return;
      const viewport = viewportRef.current;
      const track = axis === 'vertical' ? verticalTrackRef.current : horizontalTrackRef.current;

      if (!viewport || !track || event.target !== event.currentTarget) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      wake();
      const thumb = thumbsRef.current[axis];

      const trackRect = track.getBoundingClientRect();
      const pointerPosition = getPointerPosition(event, axis);
      const trackStart = axis === 'vertical' ? trackRect.top : trackRect.left;
      const pointerScale = getPointerScale(track, axis);
      const maxScroll = getScrollSize(viewport, axis) - getViewportSize(viewport, axis);
      const maxThumbOffset = getTrackSize(track, axis) - thumb.size;

      if (maxScroll <= 0 || maxThumbOffset <= 0) {
        return;
      }

      const nextThumbOffset = Math.min(
        Math.max((pointerPosition - trackStart) / pointerScale - thumb.size / 2, 0),
        maxThumbOffset,
      );

      setScrollPosition(viewport, axis, (nextThumbOffset / maxThumbOffset) * maxScroll);
      scheduleHide();
    };

    const rootClassName = cn(s.root, className);
    const verticalTrackClassName = cn(s.track, s.trackVertical, {
      [s.trackAvailable]: state.vertical,
      [s.trackAwake]: state.isAwake,
    });
    const horizontalTrackClassName = cn(s.track, s.trackHorizontal, {
      [s.trackAvailable]: state.horizontal,
      [s.trackAwake]: state.isAwake || state.isHorizontalFloating,
    });

    const horizontalTrack = (
      <div
        ref={horizontalTrackRef}
        className={horizontalTrackClassName}
        data-scrollbar-track={'horizontal'}
        data-scrollbar-owner={scrollbarId}
        aria-hidden={true}
        onPointerDown={(event) => handleTrackPointerDown(event, 'horizontal')}
        onMouseEnter={wake}
        onMouseLeave={scheduleHide}
        onLostPointerCapture={(event) => {
          if (event.pointerId === dragStateRef.current?.pointerId) {
            cancelDrag();
            scheduleHide();
          }
        }}
      >
        <div
          className={cn(s.thumb, s.thumbHorizontal)}
          ref={horizontalThumbRef}
          onPointerDown={(event) => handleThumbPointerDown(event, 'horizontal')}
        />
      </div>
    );

    return (
      <div
        {...props}
        ref={mergeRefs(rootRef, ref)}
        data-scrollbar-id={scrollbarId}
        className={rootClassName}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocusCapture={handleFocusCapture}
        onPointerDown={handlePointerDown}
      >
        <div ref={viewportRef} data-scrollbar-viewport={scrollbarId} className={s.viewport} onScroll={handleScroll}>
          <div ref={contentRef} className={s.content}>
            {children}
          </div>
        </div>
        <div
          ref={verticalTrackRef}
          className={verticalTrackClassName}
          data-scrollbar-track={'vertical'}
          aria-hidden={true}
          onPointerDown={(event) => handleTrackPointerDown(event, 'vertical')}
          onMouseEnter={wake}
          onMouseLeave={scheduleHide}
          onLostPointerCapture={(event) => {
            if (event.pointerId === dragStateRef.current?.pointerId) {
              cancelDrag();
              scheduleHide();
            }
          }}
        >
          <div
            className={cn(s.thumb, s.thumbVertical)}
            ref={verticalThumbRef}
            onPointerDown={(event) => handleThumbPointerDown(event, 'vertical')}
          />
        </div>
        {portalHost ? createPortal(horizontalTrack, portalHost) : horizontalTrack}
      </div>
    );
  },
);

Scrollbar.displayName = 'Scrollbar';
