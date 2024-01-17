/**
 * Symbol used to customize the inspection behavior of an object.
 * This symbol is used in conjunction with the `util.inspect.custom` method of Node.js.
 *
 * @since Node.js v6.6.0
 * @see https://nodejs.org/api/util.html#util_util_inspect_custom
 */
export const CUSTOM_INSPECT_SYMBOL = Symbol.for("nodejs.util.inspect.custom");
