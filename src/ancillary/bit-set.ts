/**
 * Represents a bit set, which is a collection of bits that can be individually set or queried.
 */
export class BitSet {
  private bits: string;

  /**
   * Creates a new instance of the BitSet class.
   *
   * @param n - BitSet represented as `bigint`.
   */
  private constructor(readonly n: bigint) {
    this.bits = this.n.toString(2);
  }

  static fromBigInt(n: bigint): BitSet {
    return new BitSet(n);
  }

  /**
   * Creates an empty BitSet instance.
   *
   * @returns A new empty BitSet instance.
   */
  static empty() {
    return new BitSet(0n);
  }

  /**
   * Returns a bit the specified `index` as a boolean value. 0 = `false`, 1 = `false`.
   *
   * @param index - The index of the value to retrieve. Must be a non-negative integer.
   * @returns The boolean value at the specified index. Returns false if the index referenced is not set yet.
   */
  at(index: number): boolean {
    const bits = this.bits;
    return Boolean(parseInt(bits[bits.length - 1 - index], 2));
  }

  /**
   * Sets the value of the bit at the given index in the BitSet.
   *
   * @param index - The index of the bit to set.
   * @param value - The value to set the bit to.
   * @return A new BitSet with the bit at the given index set to the specified value.
   */
  set(index: number, value: boolean): BitSet {
    const bit = value ? 1n : 0n;
    const nextN = this.n | (bit << BigInt(index));
    return new BitSet(nextN);
  }

  toBits(length: number) {
    const levels = 255;
    const path = new Array<boolean>(levels);
    for (let idx = 0; idx < levels; idx += 1) {
      path[idx] = this.at(idx);
    }
    return path;
  }

  /**
   * Presents bitset as a bigint.
   */
  toBigInt(): bigint {
    return this.n;
  }
}
