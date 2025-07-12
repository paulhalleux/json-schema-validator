import type {
  JSONSchema,
  JSONSchemaDefinition,
  ValidationError,
  ValidationResult,
} from "../types";
import type { Validator } from "./Validator.ts";
import { getTranslatedErrorMessage } from "../i18n";

export class ExecutionContext {
  private readonly _errors: ValidationError[] = [];

  private _isScoped: boolean;
  private _scope: ExecutionContext | null = null;

  constructor(
    private readonly validator: Validator,
    private readonly schema: JSONSchemaDefinition,
  ) {
    this._isScoped = false;
  }

  /**
   * Executes a callback function in a scoped context.
   * This allows for temporary changes to the execution context, such as enabling or disabling the error collection,
   * without affecting the global state of the validator.
   * @param schema - The schema to use for the scoped context.
   * @param callback - The callback function to execute within the scoped context.
   */
  runScoped(schema: JSONSchema, callback: () => void): ValidationResult {
    const context = new ExecutionContext(this.validator, schema);
    context._isScoped = true;

    if (this._isScoped) {
      throw new Error(
        "Cannot create a scoped context within another scoped context.",
      );
    }

    callback();
    const result = context.toResult();
    this._scope = null;

    return result;
  }

  /**
   * Adds a validation error to the context.
   * If the context is scoped, the error is added to the scoped errors.
   * Otherwise, it is added to the global errors.
   * @param keyword - The keyword that caused the validation error.
   * @param params - The parameters associated with the validation error.
   * @param dataPath - The path to the data that caused the error.
   * @param schemaPath - The path to the schema that defines the keyword.
   * @param data - The data that caused the validation error.
   */
  report(
    keyword: string,
    params: Record<string, any>,
    dataPath: string,
    schemaPath: string,
    data: any,
  ) {
    const error: ValidationError = {
      keyword,
      schemaPath,
      dataPath,
      params,
      parentSchema: this.schema,
      schemaValue:
        typeof this.schema === "object" ? this.schema[keyword] : this.schema,
      data,
      message: getTranslatedErrorMessage(
        this.validator.options.locale || "en",
        dataPath,
        keyword,
        params,
      ),
    };

    if (this._scope) {
      this._scope._errors.push(error);
    } else {
      this._errors.push(error);
    }
  }

  /**
   * Converts the collected errors into a validation result.
   * If there are no errors, the result is valid.
   * @return A ValidationResult object containing the validity status and any errors.
   */
  toResult(): ValidationResult {
    return {
      valid: this._errors.length === 0,
      errors: this._errors,
    };
  }
}
