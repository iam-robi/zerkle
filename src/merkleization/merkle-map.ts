import type { FieldOps } from "./field-ops.type.js";
import { type MerkleTreeWitness } from "./merkle-tree.js";
import { MerkleTree } from "./merkle-tree.js";
import { BitSet } from "../ancillary/bit-set.js";

export class MerkleMap<TField> {
  private readonly ops: FieldOps<TField>;
  private readonly tree: MerkleTree<TField>;

  constructor(ops: FieldOps<TField>) {
    this.ops = ops;
    this.tree = new MerkleTree(ops, this.ops.BITS + 1);
  }

  set(key: TField, value: TField) {
    const index = this.keyToIndex(key);
    this.tree.set(index, value);
  }

  get(key: TField) {
    const index = this.keyToIndex(key);
    return this.tree.get(index);
  }

  get root(): TField {
    return this.tree.root;
  }

  witness(key: TField): MerkleTreeWitness<TField> {
    return this.tree.witness(this.keyToIndex(key));
  }

  private keyToIndex(key: TField): bigint {
    // the bit map is reversed to make reconstructing the key during proving more convenient
    const bits = BitSet.fromBigInt(this.ops.toBigInt(key)).toBits(this.tree.height).reverse();

    let n = 0n;
    for (let i = 0; i < bits.length; i++) {
      const b = bits[i] ? 1 : 0;
      n += 2n ** BigInt(i) * BigInt(b);
    }
    return n;
  }
}
