import type { Axis } from '../../core/geometry/axis';

/** Keeps one viewport of prepared content on each side, refilling before its edge is visible. */
export class VirtualWindow {
  private axis?: Axis;
  private indices: number[] = [];
  private extent = 0;
  private overscan = 0;

  range(axis: Axis, start: number, end: number, overscan: number): number[] {
    const extent = end - start;
    if (extent <= 0 || end <= 0 || start >= axis.total || overscan === 0) {
      this.axis = undefined;
      return axis.range(start, end, overscan);
    }
    const guard = extent / 4;
    const first = this.indices[0];
    const last = this.indices.at(-1);
    if (
      this.axis === axis &&
      this.extent === extent &&
      this.overscan === overscan &&
      first !== undefined &&
      last !== undefined &&
      Math.max(0, start) >= (first === 0 ? 0 : axis.offset(first) + guard) &&
      Math.min(axis.total, end) <= (last === axis.sizes.length - 1 ? axis.total : axis.offset(last + 1) - guard)
    )
      return this.indices;

    this.axis = axis;
    this.extent = extent;
    this.overscan = overscan;
    this.indices = axis.range(start - extent, end + extent, overscan);
    return this.indices;
  }
}
