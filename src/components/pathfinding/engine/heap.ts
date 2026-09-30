/** Binary min-heap of cell indices ordered by (primary, secondary) priority. */
export class MinHeap {
  private ids: number[] = [];
  private p: number[] = [];
  private q: number[] = [];

  get size() {
    return this.ids.length;
  }

  push(id: number, primary: number, secondary = 0) {
    this.ids.push(id);
    this.p.push(primary);
    this.q.push(secondary);
    let i = this.ids.length - 1;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (!this.less(i, parent)) break;
      this.swap(i, parent);
      i = parent;
    }
  }

  pop(): number {
    const top = this.ids[0];
    const last = this.ids.length - 1;
    this.swap(0, last);
    this.ids.pop();
    this.p.pop();
    this.q.pop();
    let i = 0;
    for (;;) {
      const l = 2 * i + 1;
      const r = l + 1;
      let m = i;
      if (l < this.ids.length && this.less(l, m)) m = l;
      if (r < this.ids.length && this.less(r, m)) m = r;
      if (m === i) break;
      this.swap(i, m);
      i = m;
    }
    return top;
  }

  private less(a: number, b: number) {
    return (
      this.p[a] < this.p[b] ||
      (this.p[a] === this.p[b] && this.q[a] < this.q[b])
    );
  }

  private swap(a: number, b: number) {
    [this.ids[a], this.ids[b]] = [this.ids[b], this.ids[a]];
    [this.p[a], this.p[b]] = [this.p[b], this.p[a]];
    [this.q[a], this.q[b]] = [this.q[b], this.q[a]];
  }
}
