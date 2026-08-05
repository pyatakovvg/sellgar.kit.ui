import React from 'react';

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
  readonly horizontal: IThumbState;
  readonly isAwake: boolean;
  readonly vertical: IThumbState;
}

interface IDragState {
  readonly axis: 'horizontal' | 'vertical';
  readonly pointerPosition: number;
  readonly scrollPosition: number;
  readonly scrollSize: number;
  readonly thumbSize: number;
  readonly trackSize: number;
  readonly viewportSize: number;
}

type TScrollbarProps = React.HTMLAttributes<HTMLDivElement>;

const initialThumbState: IThumbState = {
  isVisible: false,
  offset: 0,
  size: 0,
};

const initialState: IScrollbarState = {
  horizontal: initialThumbState,
  isAwake: false,
  vertical: initialThumbState,
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

const createState = (viewport: HTMLDivElement, isAwake: boolean): IScrollbarState => {
  const verticalTrackSize = Math.max(0, viewport.clientHeight - TRACK_OFFSET * 2);
  const horizontalTrackSize = Math.max(0, viewport.clientWidth - TRACK_OFFSET * 2);

  return {
    horizontal: getThumbState(viewport.clientWidth, viewport.scrollWidth, viewport.scrollLeft, horizontalTrackSize),
    isAwake,
    vertical: getThumbState(viewport.clientHeight, viewport.scrollHeight, viewport.scrollTop, verticalTrackSize),
  };
};

const isStateEqual = (left: IScrollbarState, right: IScrollbarState) => {
  return (
    left.isAwake === right.isAwake &&
    left.vertical.isVisible === right.vertical.isVisible &&
    left.vertical.offset === right.vertical.offset &&
    left.vertical.size === right.vertical.size &&
    left.horizontal.isVisible === right.horizontal.isVisible &&
    left.horizontal.offset === right.horizontal.offset &&
    left.horizontal.size === right.horizontal.size
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
  return axis === 'vertical' ? viewport.scrollTop : viewport.scrollLeft;
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

const setScrollPosition = (viewport: HTMLDivElement, axis: IDragState['axis'], value: number) => {
  if (axis === 'vertical') {
    viewport.scrollTop = value;
    return;
  }

  viewport.scrollLeft = value;
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

export const Scrollbar = React.forwardRef<HTMLDivElement, React.PropsWithChildren<TScrollbarProps>>(
  ({ children, className, onFocusCapture, onMouseEnter, onMouseLeave, onPointerDown, onScroll, ...props }, ref) => {
    const rootRef = React.useRef<HTMLDivElement>(null);
    const viewportRef = React.useRef<HTMLDivElement>(null);
    const contentRef = React.useRef<HTMLDivElement>(null);
    const verticalTrackRef = React.useRef<HTMLDivElement>(null);
    const horizontalTrackRef = React.useRef<HTMLDivElement>(null);
    const hideTimerRef = React.useRef<number | null>(null);
    const frameRef = React.useRef<number | null>(null);
    const focusFrameRef = React.useRef<number | null>(null);
    const dragStateRef = React.useRef<IDragState | null>(null);
    const [state, setState] = React.useState<IScrollbarState>(initialState);

    const clearHideTimer = React.useCallback(() => {
      if (hideTimerRef.current == null) {
        return;
      }

      window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }, []);

    const updateState = React.useCallback((isAwake: boolean) => {
      const viewport = viewportRef.current;

      if (!viewport) {
        return;
      }

      const nextState = createState(viewport, isAwake);

      setState((previousState) => (isStateEqual(previousState, nextState) ? previousState : nextState));
    }, []);

    const requestUpdate = React.useCallback(
      (isAwake: boolean) => {
        if (frameRef.current != null) {
          window.cancelAnimationFrame(frameRef.current);
        }

        frameRef.current = window.requestAnimationFrame(() => {
          frameRef.current = null;
          updateState(isAwake);
        });
      },
      [updateState],
    );

    const scheduleHide = React.useCallback(() => {
      clearHideTimer();

      hideTimerRef.current = window.setTimeout(() => {
        hideTimerRef.current = null;
        updateState(false);
      }, HIDE_DELAY_MS);
    }, [clearHideTimer, updateState]);

    const wake = React.useCallback(() => {
      clearHideTimer();
      updateState(true);
    }, [clearHideTimer, updateState]);

    const handleWindowChange = React.useCallback(() => {
      requestUpdate(state.isAwake);
    }, [requestUpdate, state.isAwake]);

    React.useEffect(() => {
      const root = rootRef.current;
      const viewport = viewportRef.current;
      const content = contentRef.current;

      if (!root || !viewport || !content) {
        return void 0;
      }

      const resizeObserver = new ResizeObserver(() => requestUpdate(state.isAwake));
      const mutationObserver = new MutationObserver(() => requestUpdate(state.isAwake));

      resizeObserver.observe(root);
      resizeObserver.observe(viewport);
      resizeObserver.observe(content);
      mutationObserver.observe(content, {
        childList: true,
        subtree: true,
      });
      window.addEventListener('resize', handleWindowChange);

      requestUpdate(state.isAwake);

      return () => {
        resizeObserver.disconnect();
        mutationObserver.disconnect();
        window.removeEventListener('resize', handleWindowChange);
      };
    }, [handleWindowChange, requestUpdate, state.isAwake]);

    React.useEffect(() => {
      return () => {
        clearHideTimer();

        if (frameRef.current != null) {
          window.cancelAnimationFrame(frameRef.current);
        }

        if (focusFrameRef.current != null) {
          window.cancelAnimationFrame(focusFrameRef.current);
        }
      };
    }, [clearHideTimer]);

    React.useEffect(() => {
      const handlePointerMove = (event: PointerEvent) => {
        const viewport = viewportRef.current;
        const dragState = dragStateRef.current;

        if (!viewport || !dragState) {
          return;
        }

        const maxScroll = dragState.scrollSize - dragState.viewportSize;
        const maxThumbOffset = dragState.trackSize - dragState.thumbSize;

        if (maxScroll <= 0 || maxThumbOffset <= 0) {
          return;
        }

        const pointerDelta = getPointerPosition(event, dragState.axis) - dragState.pointerPosition;
        const scrollDelta = (pointerDelta / maxThumbOffset) * maxScroll;

        setScrollPosition(viewport, dragState.axis, dragState.scrollPosition + scrollDelta);
        updateState(true);
      };

      const handlePointerUp = () => {
        if (!dragStateRef.current) {
          return;
        }

        dragStateRef.current = null;
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
    }, [scheduleHide, updateState]);

    const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
      onScroll?.(event);
      wake();
      scheduleHide();
    };

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
      const viewport = viewportRef.current;
      const track = axis === 'vertical' ? verticalTrackRef.current : horizontalTrackRef.current;
      const thumb = axis === 'vertical' ? state.vertical : state.horizontal;

      if (!viewport || !track) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      event.currentTarget.setPointerCapture(event.pointerId);
      wake();

      dragStateRef.current = {
        axis,
        pointerPosition: getPointerPosition(event, axis),
        scrollPosition: getScrollPosition(viewport, axis),
        scrollSize: getScrollSize(viewport, axis),
        thumbSize: thumb.size,
        trackSize: getTrackSize(track, axis),
        viewportSize: getViewportSize(viewport, axis),
      };
    };

    const handleTrackPointerDown = (event: React.PointerEvent<HTMLDivElement>, axis: IDragState['axis']) => {
      const viewport = viewportRef.current;
      const track = axis === 'vertical' ? verticalTrackRef.current : horizontalTrackRef.current;
      const thumb = axis === 'vertical' ? state.vertical : state.horizontal;

      if (!viewport || !track || event.target !== event.currentTarget) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      wake();

      const trackRect = track.getBoundingClientRect();
      const pointerPosition = getPointerPosition(event, axis);
      const trackStart = axis === 'vertical' ? trackRect.top : trackRect.left;
      const maxScroll = getScrollSize(viewport, axis) - getViewportSize(viewport, axis);
      const maxThumbOffset = getTrackSize(track, axis) - thumb.size;

      if (maxScroll <= 0 || maxThumbOffset <= 0) {
        return;
      }

      const nextThumbOffset = Math.min(Math.max(pointerPosition - trackStart - thumb.size / 2, 0), maxThumbOffset);

      setScrollPosition(viewport, axis, (nextThumbOffset / maxThumbOffset) * maxScroll);
      scheduleHide();
    };

    const rootClassName = cn(s.root, className);

    return (
      <div
        {...props}
        ref={mergeRefs(rootRef, ref)}
        className={rootClassName}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocusCapture={handleFocusCapture}
        onPointerDown={handlePointerDown}
      >
        <div ref={viewportRef} className={s.viewport} onScroll={handleScroll}>
          <div ref={contentRef} className={s.content}>
            {children}
          </div>
        </div>
        <div
          ref={verticalTrackRef}
          className={cn(s.track, s.trackVertical, {
            [s.trackAvailable]: state.vertical.isVisible,
            [s.trackAwake]: state.isAwake,
          })}
          aria-hidden
          onPointerDown={(event) => handleTrackPointerDown(event, 'vertical')}
          onMouseEnter={wake}
          onMouseLeave={scheduleHide}
        >
          <div
            className={cn(s.thumb, s.thumbVertical)}
            style={{
              height: state.vertical.size,
              transform: `translate3d(0, ${state.vertical.offset}px, 0)`,
            }}
            onPointerDown={(event) => handleThumbPointerDown(event, 'vertical')}
          />
        </div>
        <div
          ref={horizontalTrackRef}
          className={cn(s.track, s.trackHorizontal, {
            [s.trackAvailable]: state.horizontal.isVisible,
            [s.trackAwake]: state.isAwake,
          })}
          aria-hidden
          onPointerDown={(event) => handleTrackPointerDown(event, 'horizontal')}
          onMouseEnter={wake}
          onMouseLeave={scheduleHide}
        >
          <div
            className={cn(s.thumb, s.thumbHorizontal)}
            style={{
              transform: `translate3d(${state.horizontal.offset}px, 0, 0)`,
              width: state.horizontal.size,
            }}
            onPointerDown={(event) => handleThumbPointerDown(event, 'horizontal')}
          />
        </div>
      </div>
    );
  },
);

Scrollbar.displayName = 'Scrollbar';
