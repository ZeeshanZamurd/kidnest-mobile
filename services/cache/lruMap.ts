type LruNode<K, V> = {
  key: K;
  value: V;
  prev: LruNode<K, V> | null;
  next: LruNode<K, V> | null;
};

/** Lightweight in-memory LRU — no external deps. */
export class LruMap<K, V> {
  private readonly max: number;
  private readonly map = new Map<K, LruNode<K, V>>();
  private head: LruNode<K, V> | null = null;
  private tail: LruNode<K, V> | null = null;

  constructor(maxSize: number) {
    this.max = Math.max(1, maxSize);
  }

  get size(): number {
    return this.map.size;
  }

  get(key: K): V | undefined {
    const node = this.map.get(key);
    if (!node) return undefined;
    this.moveToFront(node);
    return node.value;
  }

  set(key: K, value: V): void {
    const existing = this.map.get(key);
    if (existing) {
      existing.value = value;
      this.moveToFront(existing);
      return;
    }

    const node: LruNode<K, V> = { key, value, prev: null, next: this.head };
    if (this.head) this.head.prev = node;
    this.head = node;
    if (!this.tail) this.tail = node;
    this.map.set(key, node);

    if (this.map.size > this.max) {
      this.evictTail();
    }
  }

  delete(key: K): void {
    const node = this.map.get(key);
    if (!node) return;
    this.removeNode(node);
    this.map.delete(key);
  }

  clear(): void {
    this.map.clear();
    this.head = null;
    this.tail = null;
  }

  keys(): K[] {
    return Array.from(this.map.keys());
  }

  private moveToFront(node: LruNode<K, V>): void {
    if (this.head === node) return;
    this.removeNode(node);
    node.prev = null;
    node.next = this.head;
    if (this.head) this.head.prev = node;
    this.head = node;
    if (!this.tail) this.tail = node;
  }

  private removeNode(node: LruNode<K, V>): void {
    if (node.prev) node.prev.next = node.next;
    else this.head = node.next;
    if (node.next) node.next.prev = node.prev;
    else this.tail = node.prev;
    node.prev = null;
    node.next = null;
  }

  private evictTail(): void {
    if (!this.tail) return;
    const key = this.tail.key;
    this.removeNode(this.tail);
    this.map.delete(key);
  }
}
