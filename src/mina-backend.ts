import type { FieldOps } from "./merkleization/field-ops.type.js";
import type { JsonProof } from "o1js";
import { Bool, CircuitString, Field, Poseidon, Proof, Provable, SelfProof, Struct, ZkProgram, verify } from "o1js";
import { Tuple } from "./ancillary/tuple.js";
import type { MerkleTreeWitness } from "./merkleization/merkle-tree.js";
import type { Condition, Query } from "./query.js";
import { SIGIL } from "./query.js";
import type { MerkleMap } from "./merkleization/merkle-map.js";
import { UnreachableCaseError } from "./ancillary/unreachable-case.error.js";
import { IpldToMerkle } from "./linearisation/ipld-to-merkle.js";
import type { LinearizationModel } from "./linearisation/linearization-model.js";
import { CUSTOM_INSPECT_SYMBOL } from "./ancillary/custom-inspect-symbol.js";
/* eslint-disable */
import type * as o1js from "o1js";

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
//Todo : wait for https://github.com/o1-labs/o1js/issues/1447

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
      //@ts-ignore
      const [left, right] = maybeSwap(isLeft[i], hash, siblings[i]);
      hash = Poseidon.hash([left, right]);
      //@ts-ignore
      const bit = Provable.if(isLeft[i], Field(0), Field(1));
      key = key.mul(2).add(bit);
    }

    return [hash, key];
  }

  isValidFor(expectedRoot: Field, expectedKey: Field, value: Field): Bool {
    const [calculatedRoot, calculatedKey] = this.computeRootAndKey(value);
    //@ts-ignore
    return (
      //@ts-ignore
      calculatedRoot
        .equals(expectedRoot)
        //@ts-ignore
        .and(calculatedKey.equals(expectedKey))
    );
  }
}

function maybeSwap(b: Bool, x: Field, y: Field): [Field, Field] {
  const m = b.toField().mul(x.sub(y)); // b*(x - y)
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
  $eq: CircuitString.fromString(`$eq`).hash().toConstant(),
  $ne: CircuitString.fromString(`$ne`).hash().toConstant(),
  $gt: CircuitString.fromString(`$gt`).hash().toConstant(),
  $lt: CircuitString.fromString(`$lt`).hash().toConstant(),
  $ge: CircuitString.fromString(`$ge`).hash().toConstant(),
  $le: CircuitString.fromString(`$le`).hash().toConstant(),
  $and: CircuitString.fromString(`$and`).hash().toConstant(),
  $or: CircuitString.fromString(`$or`).hash().toConstant(),
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

const VERIFICATION_KEY = `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`;
export const QueryProgram = ZkProgram({
  name: `query-program`,
  overrideWrapDomain: 2,
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
            return this.program.and(
              new QueryInput({
                root: map.root,
                key: Field.empty(),
                given: Field.empty(),
              }),
              a,
              b,
            );
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
            return this.program.or(
              new QueryInput({
                root: map.root,
                key: Field.empty(),
                given: Field.empty(),
              }),
              a,
              b,
            );
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
            const input = new QueryInput({
              root: map.root,
              given: given,
              key: key,
            });
            return this.program.eq(input, witness, actual);
          },
          TRACE.$eq(key, given),
        );
      case SIGIL.$ne:
        return new ProveAction(
          (map) => {
            const actual = map.get(key);
            const witness = Witness.fromMerkleTreeWitness(map.witness(key));
            const input = new QueryInput({
              root: map.root,
              given: given,
              key: key,
            });
            return this.program.ne(input, witness, actual);
          },
          TRACE.$ne(key, given),
        );
      case SIGIL.$gt:
        return new ProveAction(
          (map) => {
            const actual = map.get(key);
            const witness = Witness.fromMerkleTreeWitness(map.witness(key));
            const input = new QueryInput({
              root: map.root,
              given: given,
              key: key,
            });
            return this.program.gt(input, witness, actual);
          },
          TRACE.$gt(key, given),
        );
      case SIGIL.$lt:
        return new ProveAction(
          (map) => {
            const actual = map.get(key);
            const witness = Witness.fromMerkleTreeWitness(map.witness(key));
            const input = new QueryInput({
              root: map.root,
              given: given,
              key: key,
            });
            return this.program.lt(input, witness, actual);
          },
          TRACE.$lt(key, given),
        );
      case SIGIL.$ge:
        return new ProveAction(
          (map) => {
            const actual = map.get(key);
            const witness = Witness.fromMerkleTreeWitness(map.witness(key));
            const input = new QueryInput({
              root: map.root,
              given: given,
              key: key,
            });
            return this.program.ge(input, witness, actual);
          },
          TRACE.$ge(key, given),
        );
      case SIGIL.$le:
        return new ProveAction(
          (map) => {
            const actual = map.get(key);
            const witness = Witness.fromMerkleTreeWitness(map.witness(key));
            const input = new QueryInput({
              root: map.root,
              given: given,
              key: key,
            });
            return this.program.le(input, witness, actual);
          },
          TRACE.$le(key, given),
        );
      default:
        throw new UnreachableCaseError(tag);
    }
  }
}
