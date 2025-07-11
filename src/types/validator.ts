import type { JSONSchema, JSONSchemaTypeName } from "./schema.ts";
import type { Validator } from "../core/Validator.ts";
import type * as t from "@babel/types";
import type { Compiler } from "../core/compiler/Compiler.ts";

export type ValidationError = {
  /**
   * The keyword that failed validation.
   */
  keyword: string;

  /**
   * The error message describing the validation failure.
   */
  message: string;

  /**
   * The path to the data that caused the validation error.
   */
  dataPath: string;

  /**
   * The path to the schema that defines the keyword.
   * This path excludes the keyword itself.
   * @example
   * - #/
   * - #/properties/name
   * - #/items/0
   */
  schemaPath: string;

  /**
   * The schema object that contains the keyword definition.
   */
  params: Record<string, any>;
};

export type KeywordValidator = {
  /**
   * The name of the keyword that this validator is responsible for.
   * This is used to identify the keyword in the schema and to register the validator.
   */
  keyword: string;

  /**
   * The type of data that this keyword applies to.
   * This is typically an array of strings representing JSON Schema types.
   * If not specified, the keyword applies to all types.
   */
  applyTo?: JSONSchemaTypeName[];

  /**
   * The function that validates the keyword against the schema and data.
   *
   * @param schemaValue - The value of the keyword in the schema.
   * @param data - The data at the path being validated.
   * @param context - The validation context containing paths and the validator instance.
   * @returns A boolean indicating whether the data is valid, according to the keyword.
   */
  validate?(
    schemaValue: unknown,
    data: any,
    context?: ValidationContext,
  ): ValidationError[] | boolean;

  /**
   * The function that generates the validation code for this keyword.
   * This is used to compile the schema into a validation function.
   *
   * @param schemaValue - The value of the keyword in the schema.
   * @param context - The context in which the code is being generated.
   * @returns An array of Babel statements that implement the validation logic.
   */
  code?(
    schemaValue: unknown,
    context: CodeContext,
  ): t.Statement[] | t.Statement;
};

export type CodeContext = {
  schema: JSONSchema;
  schemaPath: string;
  validator: Validator;
  compiler: Compiler;
  fail(params: Record<string, any>): t.Statement;
};

export type ValidationContext = {
  /**
   * The path to the data being validated.
   */
  dataPath: string;

  /**
   * The path to the schema that is currently being validated.
   */
  schemaPath: string;

  /**
   * The validator instance that is performing the validation.
   */
  validator: Validator;

  /**
   * The root schema being validated.
   * This is used to resolve references and for context in error messages.
   */
  rootSchema: JSONSchema;

  /**
   * The stack of references encountered during validation.
   */
  refStack: Set<string>;
};

export type ValidationResult = {
  valid: boolean;
  errors?: ValidationError[];
  data?: any;
};

export interface ValidationFn {
  (data: any): ValidationResult;
  code: string;
}
