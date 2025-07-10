import type { JSONSchema, JSONSchemaTypeName } from "./schema.ts";
import type { Validator } from "../core/Validator.ts";

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
  params?: Record<string, any>;
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
   * @param schema - The schema object containing the keyword definition.
   * @param data - The data to validate against the schema.
   * @param parentSchema - The parent schema, if applicable.
   * @param dataPath - The path to the data being validated, used for error messages.
   * @returns A boolean indicating whether the data is valid according to the keyword.
   */
  validate(
    schema: any,
    data: any,
    parentSchema?: any,
    dataPath?: string,
  ): ValidationError[] | boolean;
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

export type ValidationFn = (data: any) => ValidationResult;
