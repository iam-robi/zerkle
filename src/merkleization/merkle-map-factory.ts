import type { FieldOps } from "./field-ops.type.js";
import { LinearModel } from "../linearisation/ipld";
import { MerkleMap } from "./merkle-map.js";
import type { LinearizationModel } from "../linearisation/linearization-model.js";

export class MerkleMapFactory<TField> {
  constructor(
    private readonly ops: FieldOps<TField>,
    private readonly linearization: LinearizationModel<TField>,
  ) {}

  fromLinearModel(linearModel: LinearModel): MerkleMap<TField> {
    const map = new MerkleMap(this.ops);
    for (const [path, scalar] of linearModel.entries()) {
      const key = this.linearization.fromPath(path);
      const value = this.linearization.fromScalar(scalar);
      map.set(key, value);
    }
    return map;
  }
}
