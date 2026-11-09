import { getElementScale } from './geometry';

const CLIPPING_OVERFLOW = /^(auto|scroll|hidden|clip|overlay)$/;
const SCROLLING_OVERFLOW = /^(auto|scroll|hidden|overlay)$/;

interface IClip {
  readonly element: HTMLElement;
  readonly x: boolean;
  readonly y: boolean;
}

const getClientRect = (element: HTMLElement) => {
  const rect = element.getBoundingClientRect();
  const scale = getElementScale(element);
  const left = rect.left + element.clientLeft * scale.x;
  const top = rect.top + element.clientTop * scale.y;

  return { left, top, right: left + element.clientWidth * scale.x, bottom: top + element.clientHeight * scale.y };
};

const getVisibleRect = (element: HTMLElement, clips: readonly IClip[]) => {
  const rect = element.getBoundingClientRect();
  let { left, right, top, bottom } = rect;

  for (const clip of clips) {
    const area = getClientRect(clip.element);

    if (clip.x) {
      left = Math.max(left, area.left);
      right = Math.min(right, area.right);
    }

    if (clip.y) {
      top = Math.max(top, area.top);
      bottom = Math.min(bottom, area.bottom);
    }
  }

  return { left, right, top, bottom };
};

const getRevealDelta = (start: number, end: number, low: number, high: number) => {
  if (high <= low || end <= start || (start <= low && end >= high)) return 0;

  if (end - start > high - low) {
    return start > low ? start - low : end - high;
  }

  if (start < low) return start - low;
  if (end > high) return end - high;
  return 0;
};

export const scrollFocusedElementIntoViewport = (viewport: HTMLElement, element: HTMLElement): boolean => {
  if (element === viewport || !viewport.contains(element)) return false;

  const previousTop = viewport.scrollTop;
  const previousLeft = viewport.scrollLeft;
  const clips: IClip[] = [];
  let ancestor = element.parentElement;

  // Capture handlers run outside-in. Complete the inner reveal before measuring an outer scrollport.
  while (ancestor) {
    const style = window.getComputedStyle(ancestor);
    const clipX = CLIPPING_OVERFLOW.test(style.overflowX || style.overflow);
    const clipY = CLIPPING_OVERFLOW.test(style.overflowY || style.overflow);

    if (clipX || clipY) {
      const area = getClientRect(ancestor);
      const target = getVisibleRect(element, clips);
      const scale = getElementScale(ancestor);

      if (target.right > target.left && target.bottom > target.top) {
        const deltaX =
          SCROLLING_OVERFLOW.test(style.overflowX || style.overflow) && ancestor.scrollWidth > ancestor.clientWidth
            ? getRevealDelta(target.left, target.right, area.left, area.right) / scale.x
            : 0;
        const deltaY =
          SCROLLING_OVERFLOW.test(style.overflowY || style.overflow) && ancestor.scrollHeight > ancestor.clientHeight
            ? getRevealDelta(target.top, target.bottom, area.top, area.bottom) / scale.y
            : 0;

        if (deltaX !== 0 || deltaY !== 0) {
          ancestor.scrollTo({
            left: ancestor.scrollLeft + deltaX,
            top: ancestor.scrollTop + deltaY,
            behavior: 'instant',
          });
        }
      }

      clips.push({ element: ancestor, x: clipX, y: clipY });
    }

    if (ancestor === viewport) break;
    ancestor = ancestor.parentElement;
  }

  return viewport.scrollTop !== previousTop || viewport.scrollLeft !== previousLeft;
};
