import * as IPLD from "./linearisation/ipld.js";
import { CUSTOM_INSPECT_SYMBOL } from "./ancillary/custom-inspect-symbol.js";
import type { ElementOf } from "ts-essentials";
import { LinearPath, ScalarKind } from "./linearisation/ipld.js";
import { UnreachableCaseError } from "./ancillary/unreachable-case.error.js";

export const SIGIL = {
  $eq: "$eq",
  $ne: "$ne",
  $gt: "$gt",
  $lt: "$lt",
  $ge: "$ge",
  $le: "$le",
  $and: "$and",
  $or: "$or",
} as const;
export type SIGIL = keyof typeof SIGIL;

export class AndGate {
  static tag = SIGIL.$and;
  readonly tag = AndGate.tag;

  constructor(
    readonly a: Query,
    readonly b: Query,
  ) {}

  [CUSTOM_INSPECT_SYMBOL](_depth: number, _inspectOptions: any, inspect: (value: any) => string): string {
    return `${this.tag}(${inspect(this.a)}, ${inspect(this.b)})`;
  }
}

type AndGateGroupInput = Record<string, unknown>;
export class AndGateGroup {
  constructor(private readonly conditions: Array<Condition>) {}

  static parse(query: AndGateGroupInput): AndGateGroup {
    const conditions: Array<Condition> = Object.entries(query).map(([path, conditionQuery]) => {
      const linearPath = LinearPath(path);
      for (const Condition of Conditions) {
        const condition = Condition.parse(linearPath, conditionQuery);
        if (condition) {
          return condition;
        }
      }
      throw new Error(`Can not parse`);
    });
    return new AndGateGroup(conditions);
  }

  toQuery(): Query {
    const length = this.conditions.length;
    if (length === 0) {
      throw new Error(`Empty AND gate`);
    }
    if (length === 1) {
      return this.conditions[0];
    }
    return this.conditions
      .slice(2)
      .reduce((prev, curr) => new AndGate(prev, curr), new AndGate(this.conditions[0], this.conditions[1]));
  }
}

export class OrGate {
  static tag = SIGIL.$or;
  readonly tag = OrGate.tag;

  constructor(
    readonly a: Query,
    readonly b: Query,
  ) {}

  [CUSTOM_INSPECT_SYMBOL](_depth: number, _inspectOptions: any, inspect: (value: any) => string): string {
    return `${this.tag}(${inspect(this.a)}, ${inspect(this.b)})`;
  }
}

type OrGateGroupInput = Array<AndGateGroupInput | OrGateGroupInput>;
export class OrGateGroup {
  constructor(private readonly queries: Array<Query>) {}

  static parse(input: OrGateGroupInput): OrGateGroup {
    const queries = input.flatMap((andInput) => {
      if (Array.isArray(andInput)) {
        return OrGateGroup.parse(andInput).toQuery();
      } else {
        return AndGateGroup.parse(andInput).toQuery();
      }
    });
    return new OrGateGroup(queries);
  }

  toQuery(): Query {
    const length = this.queries.length;
    if (length === 0) {
      throw new Error(`Empty OR gate`);
    }
    if (length === 1) {
      return this.queries[0];
    }
    return this.queries
      .slice(2)
      .reduce((prev, curr) => new OrGate(prev, curr), new OrGate(this.queries[0], this.queries[1]));
  }
}

type Condition1Props = { readonly path: LinearPath; readonly expected: ScalarKind };
type Condition1Instance<Tag extends string> = {
  readonly tag: Tag;
} & Condition1Props;
function Condition1<Tag extends string>(
  tag: Tag,
): {
  new (path: LinearPath, expected: ScalarKind): Condition1Instance<Tag>;
  tag: Tag;
  parse(path: LinearPath, condition: unknown): Condition1Instance<Tag> | undefined;
} {
  const Condition1_ = class {
    static tag = tag;
    readonly tag = tag;

    static parse(path: LinearPath, condition: unknown): InstanceType<typeof Condition1_> | undefined {
      if (condition && typeof condition === "object" && tag in condition) {
        const value = (condition as any)[tag];
        const expected = IPLD.fromJS(value);
        // Use codeco
        if (!IPLD.isScalarKind(expected)) {
          throw new Error(`Not a scalar`);
        }
        return new Condition1_(path, expected);
      }
    }

    constructor(
      readonly path: LinearPath,
      readonly expected: ScalarKind,
    ) {}

    [CUSTOM_INSPECT_SYMBOL](_depth: number, _inspectOptions: any, inspect: (value: any) => string): string {
      return `${tag}(${inspect(this.path)}, ${inspect(this.expected)})`;
    }
  };
  return Condition1_;
}

class EqCondition extends Condition1(SIGIL.$eq) {}
class NeCondition extends Condition1(SIGIL.$ne) {}
class GtCondition extends Condition1(SIGIL.$gt) {}
class LtCondition extends Condition1(SIGIL.$lt) {}
class GeCondition extends Condition1(SIGIL.$ge) {}
class LeCondition extends Condition1(SIGIL.$le) {}

const Conditions = [EqCondition, NeCondition, GtCondition, LtCondition, GeCondition, LeCondition] as const;
export type Condition = InstanceType<ElementOf<typeof Conditions>>;
type Gate = AndGate | OrGate;
export type Query = Condition | Gate;

export namespace Query {
  export function parse<T>(input: T): Query {
    const t = typeof input;
    switch (t) {
      case "object": {
        if (!input) throw new Error(`Not allowed: empty`);
        if (Array.isArray(input)) {
          return OrGateGroup.parse(input).toQuery();
        }
        return AndGateGroup.parse(input).toQuery();
      }
      case "string":
      case "bigint":
      case "boolean":
      case "function":
      case "number":
      case "symbol":
      case "undefined":
        throw new Error(`Not allowed`);
      default:
        throw new UnreachableCaseError(t);
    }
  }
}
