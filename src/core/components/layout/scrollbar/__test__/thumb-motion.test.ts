// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ThumbMotion } from '../thumb-motion';

const motions: ThumbMotion[] = [];
afterEach(() => {
  motions.splice(0).forEach((motion) => motion.clear());
  document.body.replaceChildren();
  vi.unstubAllGlobals();
});

const fixture = () => {
  const source = document.createElement('div');
  const track = document.createElement('div');
  const thumb = document.createElement('div');
  track.append(thumb);
  document.body.append(source, track);
  const size = { width: 600, height: 400 };
  Object.defineProperties(track, { clientWidth: { get: () => size.width }, clientHeight: { get: () => size.height } });
  const bindings: { effect: { setKeyframes: ReturnType<typeof vi.fn> }; cancel: ReturnType<typeof vi.fn> }[] = [];
  const animate = vi.fn((_frames: Keyframe[], _options: KeyframeAnimationOptions) => {
    const binding = { effect: { setKeyframes: vi.fn() }, cancel: vi.fn() };
    bindings.push(binding);
    return binding;
  });
  thumb.animate = animate as unknown as HTMLElement['animate'];
  const constructors = vi.fn();
  vi.stubGlobal(
    'ScrollTimeline',
    class {
      constructor(options: ScrollTimelineOptions) {
        constructors(options);
      }
    },
  );
  const motion = new ThumbMotion();
  motions.push(motion);
  return { motion, source, track, thumb, size, animate, bindings, constructors };
};

describe('Native scrollbar thumb motion', () => {
  it('binds to the actual source without recreating animation during scrolling or reversals', () => {
    const { motion, source, thumb, animate, constructors, bindings } = fixture();
    for (const offset of [0, 100, 50, 300, 0])
      motion.sync(thumb, source, 'horizontal', { isVisible: true, size: 200, offset });
    expect(constructors).toHaveBeenCalledExactlyOnceWith({ source, axis: 'x' });
    expect(animate).toHaveBeenCalledTimes(1);
    expect(animate.mock.calls[0][0]).toEqual([
      { transform: 'translate3d(0px, 0, 0)' },
      { transform: 'translate3d(400px, 0, 0)' },
    ]);
    expect(bindings[0].effect.setKeyframes).not.toHaveBeenCalled();
    expect(thumb.style.transform).toBe('');
    expect(thumb.style.width).toBe('200px');
    expect(thumb.dataset.scrollbarMotion).toBe('native');
  });

  it('updates travel range without resetting progress and mirrors physical RTL endpoints', () => {
    const { motion, source, thumb, size, animate, bindings } = fixture();
    motion.sync(thumb, source, 'horizontal', { isVisible: true, size: 200, offset: 20 });
    size.width = 500;
    source.style.direction = 'rtl';
    motion.sync(thumb, source, 'horizontal', { isVisible: true, size: 100, offset: 60 });
    expect(thumb.style.width).toBe('100px');
    expect(animate).toHaveBeenCalledTimes(1);
    expect(bindings[0].effect.setKeyframes).toHaveBeenCalledWith([
      { transform: 'translate3d(400px, 0, 0)' },
      { transform: 'translate3d(0px, 0, 0)' },
    ]);
  });

  it('supports vertical motion and cleans effects and styles on teardown', () => {
    const { motion, source, thumb, bindings, constructors } = fixture();
    motion.sync(thumb, source, 'vertical', { isVisible: true, size: 100, offset: 20 });
    expect(constructors).toHaveBeenCalledWith({ source, axis: 'y' });
    expect(thumb.style.height).toBe('100px');
    motion.clear();
    motion.clear();
    expect(bindings[0].cancel).toHaveBeenCalledTimes(1);
    expect(thumb.getAttribute('style')).toBe('');
    expect(thumb.dataset.scrollbarMotion).toBeUndefined();
  });

  it('releases replaced tracks and sources and removes inactive effects when overflow disappears', () => {
    const { motion, source, thumb, track, bindings, constructors } = fixture();
    motion.sync(thumb, source, 'horizontal', { isVisible: true, size: 200, offset: 0 });
    const replacement = document.createElement('div');
    replacement.animate = thumb.animate;
    track.append(replacement);
    motion.sync(replacement, source, 'horizontal', { isVisible: true, size: 200, offset: 10 });
    expect(bindings[0].cancel).toHaveBeenCalledTimes(1);
    expect(thumb.dataset.scrollbarMotion).toBeUndefined();
    const other = document.createElement('div');
    motion.sync(replacement, other, 'horizontal', { isVisible: true, size: 200, offset: 10 });
    expect(bindings[1].cancel).toHaveBeenCalledTimes(1);
    expect(constructors).toHaveBeenLastCalledWith({ source: other, axis: 'x' });
    motion.sync(replacement, other, 'horizontal', { isVisible: false, size: 0, offset: 0 });
    expect(bindings[2].cancel).toHaveBeenCalledTimes(1);
    expect(replacement.style.transform).toBe('translate3d(0px, 0, 0)');
    expect(replacement.dataset.scrollbarMotion).toBe('direct');
  });

  it('writes fallback geometry immediately without a React render', () => {
    const { motion, source, thumb, animate } = fixture();
    vi.stubGlobal('ScrollTimeline', undefined);
    motion.sync(thumb, source, 'horizontal', { isVisible: true, size: 100, offset: 75 });
    expect(thumb.style.transform).toBe('translate3d(75px, 0, 0)');
    motion.sync(thumb, source, 'horizontal', { isVisible: true, size: 80, offset: 10 });
    expect(thumb.style.width).toBe('80px');
    expect(thumb.style.transform).toBe('translate3d(10px, 0, 0)');
    expect(animate).not.toHaveBeenCalled();
  });
});
