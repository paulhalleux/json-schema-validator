import type { Validator } from "./Validator.ts";
import type { JSONSchema } from "../types";

export interface CompilationContext {
  /**
   * A reference stack used to track references during schema compilation.
   */
  refStack: Set<string>;

  /**
   * The root schema being compiled.
   */
  rootSchema: JSONSchema;
}

/**
 * The Compiler class is responsible for compiling JSON Schemas.
 * It creates a validation function based on the provided schema and the validator.
 */
export class Compiler {
  protected readonly _validator: Validator;

  constructor(validator: Validator) {
    this._validator = validator;
  }
}
