import type {
  JSONSchema,
  JSONSchemaDefinition,
  JSONSchemaTypeName,
} from "./schema.ts";
import type { Validator } from "../core/Validator.ts";
import type { Compiler } from "../core/Compiler.ts";
import type { RefResolverFn } from "./ref.ts";
import type { Locale } from "../i18n";

import type * as t from "@babel/types";
import type { DraftVersion } from "../core/Draft.ts";

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
   * The value of the data that caused the validation error.
   * This is the actual data that failed to validate against the schema.
   */
  data: any;

  /**
   * The schema object that defines the keyword.
   * This is the part of the schema that contains the keyword definition.
   * @example
   * - { "type": "string" }
   * - { "minLength": 3 }
   */
  parentSchema: JSONSchemaDefinition;

  /**
   * The value of the keyword in the schema.
   * This is the specific value used for validation.
   * @example
   * - "string"
   * - 3
   */
  schemaValue: unknown;

  /**
   * The parameters for the keyword validation.
   * This can include additional information needed for validation, such as expected values or constraints.
   * @example
   * - { "minLength": 3 }
   * - { "enum": ["value1", "value2"] }
   */
  params: Record<string, any>;
};

export type GenerateContext = {
  /**
   * The identifier for the data being validated.
   */
  dataIdentifier: t.Identifier;

  /**
   * The schema object being validated.
   */
  schema: JSONSchema;

  /**
   * The path to the schema that defines the keyword.
   */
  schemaPath: string;

  /**
   * The root schema object.
   */
  rootSchema: JSONSchema;

  /**
   * The path to the data being validated.
   */
  dataPath: string;

  /**
   * The path to the validator instance.
   */
  validator: Validator;

  /**
   * The compiler instance used to generate the validation code.
   */
  compiler: Compiler;

  /**
   * A function to generate a failure statement for the validation.
   * This is used to create a statement that indicates a validation failure.
   *
   * @param params - The parameters for the failure statement.
   * @returns A Babel statement that represents the failure.
   */
  fail(params: Record<string, any>): t.Statement;
};

/**
 * The result of a validation function.
 * It indicates whether the validation was successful and, if not, provides a list of validation errors.
 */
export type ValidationResult = {
  valid: boolean;
  errors?: ValidationError[];
};

/**
 * A function that validates data against a schema and returns a validation result.
 * This function is used to implement custom validation logic for specific keywords or schemas.
 *
 * @param data - The data to validate.
 * @returns A ValidationResult indicating whether the data is valid and any errors encountered.
 */
export interface ValidationFn {
  (data: any): ValidationResult;
  code: string;
}

export interface ValidationFnFactory {
  (validator: Validator, schema: JSONSchemaDefinition): ValidationFn;
  code: string;
}

export type ValidatorOptions = {
  /**
   * The locale to use for error messages.
   * If not specified, the default locale will be used.
   * @default en
   */
  locale?: Locale;

  /**
   * The version of the JSON Schema draft to use.
   * @default DraftVersion.Draft_2020_12
   * @see {DraftVersion}
   */
  draftVersion?: DraftVersion;

  /**
   * An optional function to normalize the schema before validation.
   * This can be used to ensure that the schema conforms to the draft's requirements.
   */
  normalizeSchema?: (schema: JSONSchema) => JSONSchema;

  /**
   * An optional function to resolve references in the schema.
   * This function should take a reference string and return the corresponding schema.
   * Only references not starting with `#` will be resolved using this function.
   */
  refResolver?: RefResolverFn;

  /**
   * An array of keywords that should be disabled during validation.
   * This can be used to skip certain validations that are not needed.
   */
  disabledKeywords?: string[];

  /**
   * An array of keywords that should be enabled during validation.
   * If specified, only these keywords will be considered for validation.
   * `disabledKeywords` will be ignored if `enabledKeywords` is provided.
   */
  enabledKeywords?: string[];

  /**
   * A function to format error messages.
   * This function takes a ValidationError and returns a string message.
   */
  formatErrorMessages?: (error: ValidationError) => string;

  /**
   * Policy for handling circular references.
   * If set to "throw", an error will be thrown when a circular reference is detected.
   * If set to "ignore", the validator will skip the circular reference.
   * @default "throw"
   */
  circularRefPolicy?: "throw" | "ignore";
};
