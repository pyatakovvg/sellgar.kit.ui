export class Axis {
  private tree: Float64Array;
  readonly sizes: Float64Array;

  constructor(sizes: readonly number[]) {
    this.sizes = Float64Array.from(sizes);
    this.tree = new Float64Array(sizes.length + 1);
    sizes.forEach((size, index) => {
      this.tree[index + 1] += size;
      const parent = index + 1 + ((index + 1) & -(index + 1));
      if (parent < this.tree.length) this.tree[parent] += this.tree[index + 1];
    });
  }

  offset(end: number): number {
    let result = 0;
    for (let i = end; i > 0; i -= i & -i) result += this.tree[i];
    return result;
  }

  get total(): number {
    return this.offset(this.sizes.length);
  }

  set(index: number, size: number): number {
    const delta = size - this.sizes[index];
    this.sizes[index] = size;
    for (let i = index + 1; i < this.tree.length; i += i & -i) this.tree[i] += delta;
    return delta;
  }

  at(coordinate: number): number {
    if (coordinate < 0 || coordinate >= this.total) return -1;
    let index = 0;
    let sum = 0;
    let bit = 2 ** Math.floor(Math.log2(this.sizes.length));
    for (; bit >= 1; bit /= 2) {
      const next = index + bit;
      if (next < this.tree.length && sum + this.tree[next] <= coordinate) {
        index = next;
        sum += this.tree[next];
      }
    }
    return index;
  }

  range(start: number, end: number, overscan = 0): number[] {
    if (end <= 0 || start >= this.total || end <= start) return [];
    const first = Math.max(0, this.at(Math.max(0, start)) - overscan);
    const last = Math.min(
      this.sizes.length - 1,
      Math.max(first, this.at(Math.min(this.total - 0.001, end))) + overscan,
    );
    const indices: number[] = [];
    for (let i = first; i <= last; i++) if (this.sizes[i] > 0) indices.push(i);
    return indices;
  }
}
