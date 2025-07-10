import type { JSONSchema, RefResolverFn } from "../types";

export class RefResolver {
  private readonly resolvedRefs: Map<string, any> = new Map();

  constructor(private readonly refResolverFn?: RefResolverFn) {}

  /**
   * Resolves a reference to a schema.
   * @param ref - The reference string to resolve.
   * @param rootSchema - The root schema against which the reference is resolved.
   * @return A promise that resolves to the corresponding schema, or undefined if the reference cannot be resolved.
   */
  async resolveRef(
    ref: string,
    rootSchema: JSONSchema,
  ): Promise<any | undefined> {
    if (this.resolvedRefs.has(ref)) {
      return this.resolvedRefs.get(ref);
    }

    if (this.isLocalRef(ref)) {
      const resolved = this.resolveLocalRef(ref, rootSchema);
      if (resolved) {
        this.resolvedRefs.set(ref, resolved);
        return resolved;
      }
    } else {
      const resolved = await this.resolveExternalRef(ref);
      if (resolved) {
        this.resolvedRefs.set(ref, resolved);
        return resolved;
      }
    }

    return undefined;
  }

  /**
   * Checks if a reference is a local reference.
   *
   * @param ref - The reference string to check.
   * @private
   */
  private isLocalRef(ref: string): boolean {
    return ref.startsWith("#");
  }

  /**
   * Resolves a local reference within the root schema.
   *
   * @param ref - The local reference string to resolve.
   * @param rootSchema - The root schema against which the reference is resolved.
   * @return The resolved schema or undefined if the reference cannot be resolved.
   */
  private resolveLocalRef(
    ref: string,
    rootSchema: JSONSchema,
  ): any | undefined {
    if (!this.isLocalRef(ref)) {
      return undefined;
    }

    const path = ref.slice(1).split("/");
    let current = rootSchema;

    for (const segment of path) {
      if (segment in current) {
        current = current[segment];
      } else {
        return undefined;
      }
    }

    this.resolvedRefs.set(ref, current);
    return current;
  }

  /**
   * Resolves a reference using the provided resolver function.
   *
   * @param ref - The reference string to resolve.
   * @return A promise that resolves to the corresponding schema, or undefined if the reference cannot be resolved.
   */
  async resolveExternalRef(ref: string): Promise<any | undefined> {
    if (!this.refResolverFn) {
      return undefined;
    }

    try {
      let schema: JSONSchema | undefined;
      const res = this.refResolverFn(ref);
      if (res instanceof Promise) {
        schema = await res;
      } else {
        schema = res;
      }
      return schema;
    } catch (error) {
      return undefined;
    }
  }
}
