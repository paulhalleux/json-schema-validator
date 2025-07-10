import type { JSONSchema } from "./schema.ts";

/**
 * A function to resolve a reference to a schema.
 * This function takes a reference string and returns a promise that resolves to the corresponding JSONSchema.
 */
export type RefResolverFn = (
  ref: string,
) => Promise<JSONSchema | undefined> | JSONSchema | undefined;
