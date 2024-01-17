import * as IPLD from "./ipld.js";
import type { FieldOps } from "../merkleization/field-ops.type.js";
import { UnreachableCaseError } from "../ancillary/unreachable-case.error.js";
import { type LinearPath, StringKind } from "./ipld.js";
import type { LinearizationModel } from "./linearization-model.js";

const TEXT_ENCODER = new TextEncoder();

export type ToFieldFn<TField> = (input: IPLD.ScalarKind) => TField;

export class IpldToMerkle<TField> implements LinearizationModel<TField> {
  constructor(private readonly ops: FieldOps<TField>) {
    this.fromScalar = this.fromScalar.bind(this);
  }

  fromPath(path: LinearPath): TField {
    return this.fromScalar(new StringKind(path));
  }

  fromScalar(input: IPLD.ScalarKind): TField {
    const tag = input.tag;
    switch (tag) {
      case "string-kind": {
        const fields = Array.from(TEXT_ENCODER.encode(input.value)).map((byte) => this.ops.fromBigInt(BigInt(byte)));
        return this.ops.hash(...fields);
      }
      case "null-kind":
        return this.ops.fromBigInt(1n);
      case "integer-kind":
        return this.ops.fromBigInt(BigInt(input.value));
      case "boolean-kind":
        return input.value ? this.ops.fromBigInt(2n) : this.ops.fromBigInt(1n);
      default:
        throw new UnreachableCaseError(tag);
    }
  }
}
