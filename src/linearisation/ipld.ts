import type { CID } from "multiformats/cid";
import { UnreachableCaseError } from "../ancillary/unreachable-case.error.js";
import { CUSTOM_INSPECT_SYMBOL } from "../ancillary/custom-inspect-symbol.js";
import type { ElementOf, Newable, Opaque, Writable } from "ts-essentials";
import type { Kind, Type, $, Object as ObjectH, List } from "hkt-toolbelt";

/**
 * Represents an [IPLD Data Model](https://ipld.io/) `Null`.
 */
export class NullKind {
  readonly tag = "null-kind";
  readonly value = null;

  /**
   * Binds the describe method of the current object to `util.inspect.custom` symbol.
   * @see {CUSTOM_INSPECT_SYMBOL}
   * @internal
   */
  private [CUSTOM_INSPECT_SYMBOL] = this.describe.bind(this);

  /**
   * Return human-readable description of the value.
   */
  describe(): string {
    return "NullKind";
  }
}

/**
 * Represents an [IPLD Data Model](https://ipld.io/) `Boolean`.
 */
export class BooleanKind {
  readonly tag = "boolean-kind";
  constructor(readonly value: boolean) {}

  /**
   * Binds the describe method of the current object to `util.inspect.custom` symbol.
   * @see {CUSTOM_INSPECT_SYMBOL}
   * @internal
   */
  private [CUSTOM_INSPECT_SYMBOL] = this.describe.bind(this);

  /**
   * Return human-readable description of the value.
   */
  describe(): string {
    return `BooleanKind(${this.value})`;
  }
}

/**
 * Represents an [IPLD Data Model](https://ipld.io/) `Integer`.
 */
export class IntegerKind {
  readonly tag = "integer-kind";
  constructor(readonly value: number) {}

  /**
   * Binds the describe method of the current object to `util.inspect.custom` symbol.
   * @see {CUSTOM_INSPECT_SYMBOL}
   * @internal
   */
  private [CUSTOM_INSPECT_SYMBOL] = this.describe.bind(this);

  /**
   * Return human-readable description of the value.
   */
  describe(): string {
    return `IntegerKind(${this.value})`;
  }
}

/**
 * Represents an [IPLD Data Model](https://ipld.io/) `Float`.
 */
export class FloatKind {
  readonly tag = "float-kind";
  constructor(readonly value: number) {}

  /**
   * Binds the describe method of the current object to `util.inspect.custom` symbol.
   * @see {CUSTOM_INSPECT_SYMBOL}
   * @internal
   */
  private [CUSTOM_INSPECT_SYMBOL] = this.describe.bind(this);

  /**
   * Return human-readable description of the value.
   */
  describe(): string {
    return `FloatKind(${this.value})`;
  }
}

/**
 * Represents an [IPLD Data Model](https://ipld.io/) `String`.
 */
export class StringKind {
  readonly tag = "string-kind";
  constructor(readonly value: string) {}

  /**
   * Binds the describe method of the current object to `util.inspect.custom` symbol.
   * @see {CUSTOM_INSPECT_SYMBOL}
   * @internal
   */
  private [CUSTOM_INSPECT_SYMBOL] = this.describe.bind(this);

  /**
   * Return human-readable description of the value.
   */
  describe(): string {
    return `StringKind("${this.value}")`;
  }
}

/**
 * Converts a number to a two-symbol hexadecimal string representation. Pads with a leading `0` if `n < 16`.
 *
 * @param i - The number to convert.
 */
function i2hex(i: number): string {
  return ("0" + i.toString(16)).slice(-2);
}
/**
 * Converts an array of bytes to a hexadecimal string representation.
 *
 * @param bytes - The array of bytes to convert.
 * @return The hexadecimal string representation of the given bytes.
 */
function bytesToHex(bytes: Uint8Array): string {
  return bytes.reduce((memo, i) => memo + i2hex(i), "");
}

/**
 * Represents an [IPLD Data Model](https://ipld.io/) `Bytes`.
 */
export class BytesKind {
  readonly tag = "bytes-kind";
  constructor(readonly value: Uint8Array) {}

  /**
   * Binds the describe method of the current object to `util.inspect.custom` symbol.
   * @see {CUSTOM_INSPECT_SYMBOL}
   * @internal
   */
  private [CUSTOM_INSPECT_SYMBOL] = this.describe.bind(this);

  /**
   * Return human-readable description of the value.
   */
  describe(): string {
    return `BytesKind(${bytesToHex(this.value)})`;
  }
}

/**
 * Represents an [IPLD Data Model](https://ipld.io/) `List`.
 */
export class ListKind {
  readonly tag = "list-kind";
  constructor(readonly value: Kind[]) {}

  /**
   * Binds the describe method of the current object to `util.inspect.custom` symbol.
   * @see {CUSTOM_INSPECT_SYMBOL}
   * @internal
   */
  private [CUSTOM_INSPECT_SYMBOL] = this.describe.bind(this);

  /**
   * Return human-readable description of the value.
   */
  describe(): string {
    return `ListKind(${this.value.map((v) => v.describe()).join(", ")})`;
  }
}

/**
 * Represents an [IPLD Data Model](https://ipld.io/) `Map`.
 */
export class MapKind {
  readonly tag = "map-kind";
  constructor(readonly value: Record<string, Kind>) {}

  /**
   * Binds the describe method of the current object to `util.inspect.custom` symbol.
   * @see {CUSTOM_INSPECT_SYMBOL}
   * @internal
   */
  private [CUSTOM_INSPECT_SYMBOL] = this.describe.bind(this);

  /**
   * Return human-readable description of the value.
   */
  describe(): string {
    const inner = Object.entries(this.value)
      .map(([k, v]) => {
        return `${k}: ${v.describe()}`;
      })
      .join(", ");
    return `MapKind(${inner})`;
  }
}

/**
 * Represents an [IPLD Data Model](https://ipld.io/) `Link`.
 */
export class LinkKind {
  readonly tag = "link-kind";
  constructor(readonly value: CID) {}

  /**
   * Binds the describe method of the current object to `util.inspect.custom` symbol.
   * @see {CUSTOM_INSPECT_SYMBOL}
   * @internal
   */
  private [CUSTOM_INSPECT_SYMBOL] = this.describe.bind(this);

  /**
   * Return human-readable description of the value.
   */
  describe() {
    return `LinkKind(${this.value.toString()})`;
  }
}

/**
 * Constructors of scalar kinds we support.
 * @see {ScalarKind}
 */
const ScalarKinds = [NullKind, BooleanKind, IntegerKind, StringKind] as const;

/**
 * HKT type of `InstanceType<_>`.
 */
interface InstanceTypeKind extends Kind.Kind {
  f(x: Type._$cast<this[Kind._], Newable<any>>): InstanceType<typeof x>;
}
/**
 * Union of scalar i.e. non-recursive IPLD kinds, that we support here.
 */
export type ScalarKind = ElementOf<$<$<List.Map, InstanceTypeKind>, Writable<typeof ScalarKinds>>>;

/**
 * Allowed tags for scalar kinds we support. This is used to delineate between all possible scalars.
 */
const ScalarKindTags: $<$<List.Map, $<ObjectH.At, "tag">>, Writable<typeof ScalarKinds>> = [
  "null-kind",
  "boolean-kind",
  "integer-kind",
  "string-kind",
] as const;

/**
 * Determines if the given [IPLD Data Model](https://ipld.io/) kind is `ScalarKind`.
 * @param input - An instance to be checked.
 * @return Returns true if ipld is of scalar kind, false otherwise.
 */
export function isScalarKind(input: Kind): input is ScalarKind {
  return ScalarKindTags.includes(input.tag as any);
}

/**
 * Recursive [IPLD Data Model](https://ipld.io/) kinds, i.e. the ones containing other IPLD values.
 */

type RecursiveKind = ListKind | MapKind;
/**
 * Represents an unsupported scalar kind in a system.
 * @desc An unsupported scalar kind will indicate that a specific type of scalar value is not supported in the system.
 */
type UnsupportedScalarKind = FloatKind | BytesKind | LinkKind;

/**
 * All possible [IPLD Data Model](https://ipld.io/) kinds.
 */
type Kind = ScalarKind | UnsupportedScalarKind | RecursiveKind;

/**
 * Represents an error when the provided JS input could not be presented as an [IPLD Data Model](https://ipld.io/) kind.
 */
export class BadInputError extends Error {
  constructor(value: any, kind: string) {
    super(`Bad input ${value} for kind ${kind}`);
  }
}

export function fromJS(input: Array<any>): ListKind;
export function fromJS(input: Record<string, any>): MapKind;
export function fromJS(input: string): StringKind;
export function fromJS(input: number): IntegerKind | FloatKind;
export function fromJS(input: boolean): BooleanKind;
export function fromJS(input: unknown): Kind;
/**
 * Convert a JavaScript thing to an IPLD model kind.
 *
 * @param input - The input JavaScript object to convert.
 * @returns The IPLD model kind representation of the input object.
 * @throws {BadInputError} If the input object is invalid.
 * @throws {UnreachableCaseError} If `typeof input` is not handled in the code. Used for exhaustive checking.
 */
export function fromJS(input: any): Kind {
  const t = typeof input;
  switch (t) {
    case "string":
      return new StringKind(input);
    case "object": {
      if (input === null) {
        return new NullKind();
      }
      if (Array.isArray(input)) {
        const elements = input.map(fromJS);
        return new ListKind(elements);
      }
      if (input instanceof Uint8Array) {
        return new BytesKind(input);
      }
      const record: Record<string, Kind> = {};
      for (const [k, v] of Object.entries(input)) {
        record[k] = fromJS(v);
      }
      return new MapKind(record);
    }
    case "number": {
      if (Number.isNaN(input) || !Number.isFinite(input)) {
        throw new BadInputError(input, t);
      }
      if (Number.isInteger(input)) {
        if (input > Number.MAX_SAFE_INTEGER) {
          throw new BadInputError(input, t);
        }
        if (input === 0) {
          return new IntegerKind(0);
        }
        return new IntegerKind(input);
      } else {
        return new FloatKind(input);
      }
    }
    case "boolean":
      return new BooleanKind(input);
    case "undefined":
    case "function":
    case "bigint":
    case "symbol":
      throw new BadInputError(input, t);
    default:
      throw new UnreachableCaseError(t, "Unknown IPLD model kind");
  }
}

/**
 * A string that represents a JSON pointer to a scalar value of an IPLD model block.
 * @todo Maybe it makes sense to use dot-notation ^ and get rid of '0
 */
export type LinearPath = Opaque<string, "linear-path">;

/**
 * Marks `input` string as `LinearPath`.
 * @see {LinearPath}
 */
export function LinearPath(input: string): LinearPath {
  return input as LinearPath;
}

// Slashes are not allowed in name
// TODO escape internal slashes (except leading one) and '0
/**
 * Adds a `name` to `parent` `LinearPath` making it a new LinearPath.
 * @see LinearPath
 */
LinearPath.make = function (name: string, parent: LinearPath = "" as LinearPath): LinearPath {
  if (name.match(/\//g)) throw new Error(`Slashes are not allowed`);
  return `${parent}/${name}` as LinearPath;
};

/**
 * Make a linear path from a collection of elements.
 */
LinearPath.fromElements = function (...input: Array<string>): LinearPath {
  return input.slice(1).reduce((parent: LinearPath, name) => LinearPath.make(name, parent), LinearPath.make(input[0]));
};

/**
 * Element of a linearized IPLD document.
 */
export class LinearElement {
  constructor(
    readonly path: LinearPath,
    readonly value: ScalarKind,
  ) {}
}

/**
 * Represents an error that is thrown when an unsupported scalar kind is encountered during linearization.
 */
export class UnsupportedScalarKindError extends Error {
  constructor(kind: UnsupportedScalarKind["tag"]) {
    super(`Scalar kind ${kind} is not supported for linearization`);
  }
}

/**
 * Converts an IPLD structure to an array of linear elements.
 *
 * @param ipld - The IPLD structure to be converted.
 * @param [parent=""] - The parent path of the IPLD structure.
 * @returns An array of linear elements.
 * @throws {UnsupportedScalarKindError} If the IPLD structure contains an unsupported scalar kind.
 * @throws {UnreachableCaseError} If the IPLD structure contains an unreachable case. Used for exhaustiveness check.
 */
export function toLinearElements(ipld: Kind, parent: LinearPath = "" as LinearPath): Array<LinearElement> {
  const tag = ipld.tag;
  switch (tag) {
    case "null-kind":
    case "boolean-kind":
    case "integer-kind":
    case "string-kind": {
      return [new LinearElement(parent, ipld)];
    }
    case "bytes-kind":
    case "float-kind":
    case "link-kind":
      throw new UnsupportedScalarKindError(tag);
    case "list-kind":
      return ipld.value.flatMap((value, index) => toLinearElements(value, LinearPath.make(`'${index}`, parent)));
    case "map-kind": {
      return Object.entries(ipld.value).flatMap(([name, value]) => {
        return toLinearElements(value, LinearPath.make(name, parent));
      });
    }
    default:
      throw new UnreachableCaseError(tag);
  }
}

/**
 * Linearized version of an IPLD document.
 */
export class LinearModel {
  #map: Map<LinearPath, ScalarKind>;

  private constructor(map: Map<LinearPath, ScalarKind>) {
    this.#map = map;
  }

  /**
   * The number of items in the linearized document.
   */
  get size() {
    return this.#map.size;
  }

  /**
   * Returns an IterableIterator containing key-value pairs of LinearPath and ScalarKind.
   */
  entries(): IterableIterator<[LinearPath, ScalarKind]> {
    return this.#map.entries();
  }

  /**
   * Create a LinearModel from a given IPLD object.
   *
   * @param ipld The IPLD object.
   * @return The LinearModel created from the IPLD object.
   */
  static fromIPLD(ipld: Kind) {
    const elements = toLinearElements(ipld);
    const map = new Map<LinearPath, ScalarKind>();
    for (const element of elements) {
      map.set(element.path, element.value);
    }
    return new LinearModel(map);
  }

  /**
   * Creates a new instance of LinearModel from a JavaScript object.
   *
   * @param input - The input JavaScript object.
   * @returns A new instance of LinearModel.
   */
  static fromJS(input: unknown): LinearModel {
    const ipld = fromJS(input);
    return this.fromIPLD(ipld);
  }
}
