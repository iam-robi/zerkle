import type { FieldOps } from "./merkleization/field-ops.type.js";
import {
  Bool,
  CircuitString,
  Field,
  Poseidon,
  Proof,
  Provable,
  SelfProof,
  Struct,
  ZkProgram,
  verify,
  JsonProof,
} from "o1js";
import { Tuple } from "./ancillary/tuple.js";
import type { MerkleTreeWitness } from "./merkleization/merkle-tree.js";
import { Condition, Query, SIGIL } from "./query.js";
import { MerkleMap } from "./merkleization/merkle-map.js";
import { UnreachableCaseError } from "./ancillary/unreachable-case.error.js";
import { IpldToMerkle } from "./linearisation/ipld-to-merkle.js";
import type { LinearizationModel } from "./linearisation/linearization-model.js";
import { CUSTOM_INSPECT_SYMBOL } from "./ancillary/custom-inspect-symbol.js";

export const MINA_OPS: FieldOps<Field> = {
  ZERO: Field(0n),
  BITS: 255,
  equal(a: Field, b: Field): boolean {
    return a.equals(b).toBoolean();
  },
  hash(...fields): Field {
    return Poseidon.hash(fields);
  },
  toBigInt(a: Field): bigint {
    return a.toBigInt();
  },
  fromBigInt(a: bigint): Field {
    return Field(a);
  },
};

class Witness extends Struct({
  isLefts: Tuple(Bool, 255),
  siblings: Tuple(Field, 255),
}) {
  static fromMerkleTreeWitness(w: MerkleTreeWitness<Field>): Witness {
    const isLefts = w.map((w) => Bool(w.isLeft)) as Tuple<Bool, 255>;
    const siblings = w.map((w) => w.sibling) as Tuple<Field, 255>;
    return new Witness({ isLefts, siblings });
  }

  computeRootAndKey(value: Field) {
    let hash = value;
    const isLeft = this.isLefts;
    const siblings = this.siblings;
    let key = Field(0);

    for (let i = 0; i < isLeft.length; i++) {
      const [left, right] = maybeSwap(isLeft[i], hash, siblings[i]);
      hash = Poseidon.hash([left, right]);

      const bit = Provable.if(isLeft[i], Field(0), Field(1));
      key = key.mul(2).add(bit);
    }

    return [hash, key];
  }

  isValidFor(expectedRoot: Field, expectedKey: Field, value: Field): Bool {
    const [calculatedRoot, calculatedKey] = this.computeRootAndKey(value);
    return calculatedRoot.equals(expectedRoot).and(calculatedKey.equals(expectedKey));
  }
}

function maybeSwap(b: Bool, x: Field, y: Field): [Field, Field] {
  let m = b.toField().mul(x.sub(y)); // b*(x - y)
  const x_ = y.add(m); // y + b*(x - y)
  const y_ = x.sub(m); // x - b*(x - y) = x + b*(y - x)
  return [x_, y_];
}

class QueryInput extends Struct({ root: Field, key: Field, given: Field }) {}
class QueryOutput extends Struct({
  isSatisfied: Bool,
  trace: Field,
}) {}

const SIGIL_FIELDS: { [K in keyof typeof SIGIL]: Field } = {
  $eq: CircuitString.fromString("$eq").hash().toConstant(),
  $ne: CircuitString.fromString("$ne").hash().toConstant(),
  $gt: CircuitString.fromString("$gt").hash().toConstant(),
  $lt: CircuitString.fromString("$lt").hash().toConstant(),
  $ge: CircuitString.fromString("$ge").hash().toConstant(),
  $le: CircuitString.fromString("$le").hash().toConstant(),
  $and: CircuitString.fromString("$and").hash().toConstant(),
  $or: CircuitString.fromString("$or").hash().toConstant(),
};

const TRACE = {
  [SIGIL.$eq]: (key: Field, given: Field) => {
    return Poseidon.hash([SIGIL_FIELDS.$eq, key, given]);
  },
  [SIGIL.$ne]: (key: Field, given: Field) => {
    return Poseidon.hash([SIGIL_FIELDS.$ne, key, given]);
  },
  [SIGIL.$gt]: (key: Field, given: Field) => {
    return Poseidon.hash([SIGIL_FIELDS.$gt, key, given]);
  },
  [SIGIL.$lt]: (key: Field, given: Field) => {
    return Poseidon.hash([SIGIL_FIELDS.$lt, key, given]);
  },
  [SIGIL.$ge]: (key: Field, given: Field) => {
    return Poseidon.hash([SIGIL_FIELDS.$ge, key, given]);
  },
  [SIGIL.$le]: (key: Field, given: Field) => {
    return Poseidon.hash([SIGIL_FIELDS.$le, key, given]);
  },
  [SIGIL.$and]: (traceA: Field, traceB: Field) => {
    return Poseidon.hash([SIGIL_FIELDS.$and, traceA, traceB]);
  },
  [SIGIL.$or]: (traceA: Field, traceB: Field) => {
    return Poseidon.hash([SIGIL_FIELDS.$or, traceA, traceB]);
  },
} satisfies Record<SIGIL, any>;

const VERIFICATION_KEY =
  "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";
export const QueryProgram = ZkProgram({
  name: "query-program",
  publicInput: QueryInput,
  publicOutput: QueryOutput,
  methods: {
    eq: {
      privateInputs: [Witness, Field],
      method(input: QueryInput, witness: Witness, value: Field): QueryOutput {
        const isSatisfied = witness.isValidFor(input.root, input.key, value).and(value.equals(input.given));
        const trace = TRACE.$eq(input.key, input.given);
        return new QueryOutput({ isSatisfied, trace });
      },
    },
    ne: {
      privateInputs: [Witness, Field],
      method(input: QueryInput, witness: Witness, value: Field): QueryOutput {
        const isSatisfied = witness.isValidFor(input.root, input.key, value).and(value.equals(input.given).not());
        const trace = TRACE.$ne(input.key, input.given);
        return new QueryOutput({ isSatisfied, trace });
      },
    },
    gt: {
      privateInputs: [Witness, Field],
      method(input: QueryInput, witness: Witness, value: Field): QueryOutput {
        const isSatisfied = witness.isValidFor(input.root, input.key, value).and(value.greaterThan(input.given));
        const trace = TRACE.$gt(input.key, input.given);
        return new QueryOutput({ isSatisfied, trace });
      },
    },
    lt: {
      privateInputs: [Witness, Field],
      method(input: QueryInput, witness: Witness, value: Field): QueryOutput {
        const isSatisfied = witness.isValidFor(input.root, input.key, value).and(value.lessThan(input.given));
        const trace = TRACE.$lt(input.key, input.given);
        return new QueryOutput({ isSatisfied, trace });
      },
    },
    ge: {
      privateInputs: [Witness, Field],
      method(input: QueryInput, witness: Witness, value: Field): QueryOutput {
        const isSatisfied = witness.isValidFor(input.root, input.key, value).and(value.greaterThanOrEqual(input.given));
        const trace = TRACE.$ge(input.key, input.given);
        return new QueryOutput({ isSatisfied, trace });
      },
    },
    le: {
      privateInputs: [Witness, Field],
      method(input: QueryInput, witness: Witness, value: Field): QueryOutput {
        const isSatisfied = witness.isValidFor(input.root, input.key, value).and(value.lessThanOrEqual(input.given));
        const trace = TRACE.$le(input.key, input.given);
        return new QueryOutput({ isSatisfied, trace });
      },
    },
    and: {
      privateInputs: [SelfProof, SelfProof],
      method(
        input: QueryInput,
        a: SelfProof<QueryInput, QueryOutput>,
        b: SelfProof<QueryInput, QueryOutput>,
      ): QueryOutput {
        input.root.assertEquals(b.publicInput.root);
        input.root.assertEquals(a.publicInput.root);

        a.verify();
        b.verify();
        return new QueryOutput({
          isSatisfied: a.publicOutput.isSatisfied.and(b.publicOutput.isSatisfied),
          trace: TRACE.$and(a.publicOutput.trace, b.publicOutput.trace),
        });
      },
    },
    or: {
      privateInputs: [SelfProof, SelfProof],
      method(
        input: QueryInput,
        a: SelfProof<QueryInput, QueryOutput>,
        b: SelfProof<QueryInput, QueryOutput>,
      ): QueryOutput {
        input.root.assertEquals(b.publicInput.root);
        input.root.assertEquals(a.publicInput.root);

        a.verify();
        b.verify();
        return new QueryOutput({
          isSatisfied: a.publicOutput.isSatisfied.or(b.publicOutput.isSatisfied),
          trace: TRACE.$or(a.publicOutput.trace, b.publicOutput.trace),
        });
      },
    },
  },
});

export class ExecutionProof {
  static version = 0 as const;
  readonly version = ExecutionProof.version;
  constructor(
    readonly proof: Proof<QueryInput, QueryOutput>,
    readonly verificationKey: string,
  ) {}

  get trace(): Field {
    return this.proof.publicOutput.trace;
  }

  get isSatisfied(): boolean {
    return this.proof.publicOutput.isSatisfied.toBoolean();
  }

  static fromJSON(json: ReturnType<ExecutionProof["toJSON"]>) {
    if (json.version !== ExecutionProof.version) throw new Error(`Unsupported version`);
    const proof = Proof.fromJSON(json.proof);
    const verificationKey = json.verificationKey;
    return new ExecutionProof(proof, verificationKey);
  }

  toJSON(): { verificationKey: string; proof: JsonProof; version: number } {
    return {
      version: this.version,
      verificationKey: this.verificationKey,
      proof: this.proof.toJSON(),
    };
  }

  [CUSTOM_INSPECT_SYMBOL]() {
    return `ExecutionProof(${this.isSatisfied}, ${this.trace.toString()})`;
  }
}

export class ProveAction {
  constructor(
    readonly run: (map: MerkleMap<Field>) => Promise<Proof<QueryInput, QueryOutput>>,
    readonly expectedTrace: Field,
  ) {}
}

export class Verification {
  constructor(
    readonly verificationKey: string = VERIFICATION_KEY,
    readonly linearization: LinearizationModel<Field> = IPLD_LINEARIZATION,
  ) {}

  static check(query: Query, executionProof: ExecutionProof): Promise<boolean> {
    const v = new Verification();
    return v.verify(query, executionProof);
  }

  private async verify(query: Query, executionProof: ExecutionProof): Promise<boolean> {
    // 1. Verify Trace
    const fauxProgram = {} as unknown as typeof QueryProgram;
    const backend = new Backend(fauxProgram, this.verificationKey, this.linearization);
    const proveAction = backend.proveQuery(query);
    const isSameTrace = proveAction.expectedTrace.equals(executionProof.trace).toBoolean();
    // 2. Verify Proof
    const isZKVerified = await verify(executionProof.proof, executionProof.verificationKey);
    return isSameTrace && isZKVerified;
  }
}

export const IPLD_LINEARIZATION = new IpldToMerkle(MINA_OPS);

export class Backend {
  static VERIFICATION_KEY = VERIFICATION_KEY;

  constructor(
    readonly program: typeof QueryProgram,
    readonly verificationKey: string,
    readonly linearization: LinearizationModel<Field>,
  ) {}

  static async compile(): Promise<Backend> {
    const { verificationKey } = await QueryProgram.compile();
    if (verificationKey.data !== Backend.VERIFICATION_KEY) {
      throw new Error(`Invalid verification key stored`);
    }
    return new Backend(QueryProgram, verificationKey.data, IPLD_LINEARIZATION);
  }

  async execute(map: MerkleMap<Field>, query: Query): Promise<ExecutionProof> {
    const proof = await this.proveQuery(query).run(map);
    return new ExecutionProof(proof, this.verificationKey);
  }

  proveQuery(query: Query): ProveAction {
    const tag = query.tag;
    switch (tag) {
      case SIGIL.$eq:
      case SIGIL.$ne:
      case SIGIL.$gt:
      case SIGIL.$lt:
      case SIGIL.$ge:
      case SIGIL.$le: {
        return this.proveCondition(tag, query);
      }
      case SIGIL.$and: {
        const actionA = this.proveQuery(query.a);
        const actionB = this.proveQuery(query.b);
        return new ProveAction(
          async (map) => {
            const a = await actionA.run(map);
            const b = await actionB.run(map);
            return this.program.and(new QueryInput({ root: map.root, key: Field.empty(), given: Field.empty() }), a, b);
          },
          TRACE.$and(actionA.expectedTrace, actionB.expectedTrace),
        );
      }
      case SIGIL.$or: {
        const actionA = this.proveQuery(query.a);
        const actionB = this.proveQuery(query.b);
        return new ProveAction(
          async (map) => {
            const a = await actionA.run(map);
            const b = await actionB.run(map);
            return this.program.or(new QueryInput({ root: map.root, key: Field.empty(), given: Field.empty() }), a, b);
          },
          TRACE.$or(actionA.expectedTrace, actionB.expectedTrace),
        );
      }
      default:
        throw new UnreachableCaseError(tag);
    }
  }

  /**
   * Proves the condition based on the given tag and inputs.
   *
   * @param tag - The tag of the condition.
   * @param {Condition} query - The condition query.
   * @returns {Promise<Proof<PublicInput, Bool>>} The proof of the condition.
   * @throws {UnreachableCaseError} Throws an error if the tag is unknown.
   */
  private proveCondition(tag: Condition["tag"], query: Condition): ProveAction {
    const key = this.linearization.fromPath(query.path);
    const given = this.linearization.fromScalar(query.expected);
    switch (tag) {
      case SIGIL.$eq:
        return new ProveAction(
          (map) => {
            const key = this.linearization.fromPath(query.path);
            const actual = map.get(key);
            const witness = Witness.fromMerkleTreeWitness(map.witness(key));
            const given = this.linearization.fromScalar(query.expected);
            const input = new QueryInput({ root: map.root, given: given, key: key });
            return this.program.eq(input, witness, actual);
          },
          TRACE.$eq(key, given),
        );
      case SIGIL.$ne:
        return new ProveAction(
          (map) => {
            const actual = map.get(key);
            const witness = Witness.fromMerkleTreeWitness(map.witness(key));
            const input = new QueryInput({ root: map.root, given: given, key: key });
            return this.program.ne(input, witness, actual);
          },
          TRACE.$ne(key, given),
        );
      case SIGIL.$gt:
        return new ProveAction(
          (map) => {
            const actual = map.get(key);
            const witness = Witness.fromMerkleTreeWitness(map.witness(key));
            const input = new QueryInput({ root: map.root, given: given, key: key });
            return this.program.gt(input, witness, actual);
          },
          TRACE.$gt(key, given),
        );
      case SIGIL.$lt:
        return new ProveAction(
          (map) => {
            const actual = map.get(key);
            const witness = Witness.fromMerkleTreeWitness(map.witness(key));
            const input = new QueryInput({ root: map.root, given: given, key: key });
            return this.program.lt(input, witness, actual);
          },
          TRACE.$lt(key, given),
        );
      case SIGIL.$ge:
        return new ProveAction(
          (map) => {
            const actual = map.get(key);
            const witness = Witness.fromMerkleTreeWitness(map.witness(key));
            const input = new QueryInput({ root: map.root, given: given, key: key });
            return this.program.ge(input, witness, actual);
          },
          TRACE.$ge(key, given),
        );
      case SIGIL.$le:
        return new ProveAction(
          (map) => {
            const actual = map.get(key);
            const witness = Witness.fromMerkleTreeWitness(map.witness(key));
            const input = new QueryInput({ root: map.root, given: given, key: key });
            return this.program.le(input, witness, actual);
          },
          TRACE.$le(key, given),
        );
      default:
        throw new UnreachableCaseError(tag);
    }
  }
}
