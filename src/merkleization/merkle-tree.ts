import { FieldOps } from "./field-ops.type.js";

export type MerkleTreeWitness<TField> = Array<{ isLeft: boolean; sibling: TField }>;

export class MerkleTree<TField> {
  private nodes: Record<number, Record<string, TField>> = {};
  private zeroes: TField[];
  public readonly height: number;
  private readonly ops: FieldOps<TField>;

  constructor(ops: FieldOps<TField>, height: number) {
    this.height = height;
    this.ops = ops;
    this.zeroes = new Array(height);
    this.zeroes[0] = ops.ZERO;
    for (let i = 1; i < height; i += 1) {
      this.zeroes[i] = ops.hash(this.zeroes[i - 1], this.zeroes[i - 1]);
    }
  }

  private getNode(level: number, index: bigint): TField {
    return this.nodes[level]?.[index.toString()] ?? this.zeroes[level];
  }

  get(index: bigint): TField {
    return this.getNode(0, index);
  }

  get root(): TField {
    return this.getNode(this.height - 1, 0n);
  }

  // TODO: this allows to set a node at an index larger than the size. OK?
  private setNode(level: number, index: bigint, value: TField) {
    (this.nodes[level] ??= {})[index.toString()] = value;
  }

  // TODO: if this is passed an index bigger than the max, it will set a couple of out-of-bounds nodes but not affect the real Merkle root. OK?
  /**
   * Sets the value of a leaf node at a given index to a given value.
   * @param index Position of the leaf node.
   * @param leaf New value.
   */
  set(index: bigint, leaf: TField) {
    if (index >= this.capacity) {
      throw new Error(`index ${index} is out of range for ${this.capacity} leaves.`);
    }
    this.setNode(0, index, leaf);
    let currIndex = index;
    for (let level = 1; level < this.height; level++) {
      currIndex /= 2n;

      const left = this.getNode(level - 1, currIndex * 2n);
      const right = this.getNode(level - 1, currIndex * 2n + 1n);

      this.setNode(level, currIndex, this.ops.hash(left, right)); // TODO leaf hash
    }
  }

  /**
   * Returns the witness (also known as [Merkle Proof or Merkle Witness](https://computersciencewiki.org/index.php/Merkle_proof)) for the leaf at the given index.
   * @param index Position of the leaf node.
   * @returns The witness that belongs to the leaf.
   */
  witness(index: bigint): MerkleTreeWitness<TField> {
    if (index >= this.capacity) {
      throw new Error(`index ${index} is out of range for ${this.capacity} leaves.`);
    }
    const witness = [];
    for (let level = 0; level < this.height - 1; level++) {
      const isLeft = index % 2n === 0n;
      const sibling = this.getNode(level, isLeft ? index + 1n : index - 1n);
      witness.push({ isLeft, sibling });
      index /= 2n;
    }
    return witness;
  }

  /**
   * Returns the amount of leaf nodes.
   * @returns Amount of leaf nodes.
   */
  get capacity(): bigint {
    return 2n ** BigInt(this.height - 1);
  }
}
