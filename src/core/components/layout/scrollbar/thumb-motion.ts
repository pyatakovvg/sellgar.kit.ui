export interface ThumbGeometry {
  readonly isVisible: boolean;
  readonly offset: number;
  readonly size: number;
}

type Axis = 'horizontal' | 'vertical';

interface Binding {
  readonly thumb: HTMLElement;
  readonly source: HTMLElement;
  readonly animation?: Animation;
  readonly distance: number;
  readonly reversed: boolean;
}

const transform = (axis: Axis, offset: number): string =>
  axis === 'horizontal' ? `translate3d(${offset}px, 0, 0)` : `translate3d(0, ${offset}px, 0)`;

/** DOM/native owner of thumb motion. React controls track visibility and composition. */
export class ThumbMotion {
  private readonly bindings = new Map<Axis, Binding>();

  sync(thumb: HTMLElement, source: HTMLElement, axis: Axis, geometry: ThumbGeometry): void {
    const track = thumb.parentElement;
    if (!track) return;
    const horizontal = axis === 'horizontal';
    const distance = Math.max(0, (horizontal ? track.clientWidth : track.clientHeight) - geometry.size);
    const reversed = horizontal && getComputedStyle(source).direction === 'rtl';
    const native =
      geometry.isVisible && distance > 0 && typeof ScrollTimeline === 'function' && typeof thumb.animate === 'function';
    let binding = this.bindings.get(axis);
    if (binding && (binding.thumb !== thumb || binding.source !== source || Boolean(binding.animation) !== native)) {
      this.release(axis);
      binding = undefined;
    }

    const sizeProperty = horizontal ? 'width' : 'height';
    const size = `${geometry.size}px`;
    if (thumb.style[sizeProperty] !== size) thumb.style[sizeProperty] = size;
    const frames = [
      { transform: transform(axis, reversed ? distance : 0) },
      { transform: transform(axis, reversed ? 0 : distance) },
    ];
    if (native) {
      if (!binding) {
        thumb.style.removeProperty('transform');
        const animation = thumb.animate(frames, {
          timeline: new ScrollTimeline({ source, axis: horizontal ? 'x' : 'y' }),
          duration: 1,
          easing: 'linear',
          fill: 'both',
        });
        this.bindings.set(axis, { thumb, source, animation, distance, reversed });
      } else if (binding.distance !== distance || binding.reversed !== reversed) {
        (binding.animation!.effect as KeyframeEffect).setKeyframes(frames);
        this.bindings.set(axis, { ...binding, distance, reversed });
      }
    } else {
      thumb.style.transform = transform(axis, geometry.offset);
      this.bindings.set(axis, { thumb, source, distance, reversed });
    }
    thumb.dataset.scrollbarMotion = native ? 'native' : 'direct';
  }

  clear(): void {
    for (const axis of [...this.bindings.keys()]) this.release(axis);
  }

  private release(axis: Axis): void {
    const binding = this.bindings.get(axis);
    if (!binding) return;
    binding.animation?.cancel();
    binding.thumb.style.removeProperty('transform');
    binding.thumb.style.removeProperty(axis === 'horizontal' ? 'width' : 'height');
    delete binding.thumb.dataset.scrollbarMotion;
    this.bindings.delete(axis);
  }
}
