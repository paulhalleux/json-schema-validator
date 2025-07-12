import type { JSONSchemaTypeName } from "../types";
import type * as t from "@babel/types";
import type { CompilationContext } from "./Compiler.ts";

/**
 * Represents a validator for a specific JSON Schema keyword.
 * This interface defines the structure and methods required for a keyword validator.
 */
export interface KeywordValidator {
  /**
   * The name of the keyword that this validator is responsible for.
   * This is used to identify the keyword in the schema and to register the validator.
   */
  readonly keyword: string;

  /**
   * The type of data that this keyword applies to.
   * This is typically an array of strings representing JSON Schema types.
   * If not specified, the keyword applies to all types.
   */
  readonly applicableTypes?: JSONSchemaTypeName[];

  /**
   * The function that generates the validation code for this keyword.
   * This is used to compile the schema into a validation function.
   *
   * Optionally, this function can return a Promise if the code generation is asynchronous.
   *
   * @param schemaValue - The value of the keyword in the schema.
   * @param context - The context in which the code is being generated.
   * @returns An array of Babel statements that implement the validation logic.
   */
  code(
    schemaValue: unknown,
    context: CompilationContext,
  ): t.Statement | Promise<t.Statement>;
}
