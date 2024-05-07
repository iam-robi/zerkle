import { Backend, IPLD_LINEARIZATION, MINA_OPS, Verification, QueryProgram } from "./mina-backend.js";
import { Query } from "./query.js";
import { MerkleMapFactory as MapFactory } from "./merkleization/merkle-map-factory.js";
import { Field } from "o1js";
import { LinearModel } from "./linearisation/ipld";
import { MerkleMap } from "./merkleization/merkle-map.js";
import * as IPLD from "./linearisation/ipld.js";

class MerkleMapFactory extends MapFactory<Field> {
  constructor() {
    super(MINA_OPS, IPLD_LINEARIZATION);
  }

  static fromLinearModel(linearModel: LinearModel): MerkleMap<Field> {
    const factory = new MerkleMapFactory();
    return factory.fromLinearModel(linearModel);
  }
}

export { MerkleMapFactory, Backend, IPLD_LINEARIZATION, MINA_OPS, Verification, Query, IPLD, QueryProgram };
