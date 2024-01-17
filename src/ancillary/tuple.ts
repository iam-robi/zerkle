export type Tuple<T, N extends number> = N extends N ? (number extends N ? T[] : _TupleOf<T, N, []>) : never;
type _TupleOf<T, N extends number, R extends unknown[]> = R["length"] extends N ? R : _TupleOf<T, N, [T, ...R]>;

/**
 * Creates a tuple with the specified element repeated `n` times.
 *
 * @param element - The element to repeat in the tuple.
 * @param n - The number of times to repeat the element.
 * @throws {RangeError} If `n` is less than 1.
 * @returns The tuple with the specified element repeated `n` times.
 */
export function Tuple<T, N extends number>(element: T, n: N): Tuple<T, N> {
  if (n < 1) throw new RangeError(`Expect at least one element`);
  return Array(n).fill(element) as any;
}
