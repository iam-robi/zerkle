/**
 * Error class for cases that should be unreachable. Used for exhaustiveness check.
 */
export class UnreachableCaseError extends Error {
  constructor(value: never, message?: string) {
    super(message ? `Unhandled case ${value}: ${message}` : `Unhandled case ${value}`);
  }
}
