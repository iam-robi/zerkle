import type { LinearPath, ScalarKind } from "./ipld";

export interface LinearizationModel<TField> {
  fromPath(path: LinearPath): TField;
  fromScalar(input: ScalarKind): TField;
}
