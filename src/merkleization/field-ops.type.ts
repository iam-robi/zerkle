export interface FieldOps<TField> {
  ZERO: TField;
  BITS: number;
  equal(a: TField, b: TField): boolean;
  hash(...fields: Array<TField>): TField;
  toBigInt(a: TField): bigint;
  fromBigInt(a: bigint): TField;
}
