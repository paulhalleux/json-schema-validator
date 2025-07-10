/**
 * A function that coerces a value from one type to another.
 */
export type CustomCoercionHook = (
  value: any,
  expectedType: string,
  path: string,
) => any;

/**
 * Represents an entry in the coercion log.
 * This is used to track the coercion process, including the original value,
 * the coerced value, and the path in the schema where the coercion occurred.
 */
export type CoercionEntry = {
  path: string;
  from: string;
  to: string;
  original: any;
  coerced: any;
};
