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
  private _scope: ExecutionContext | null = null;

  constructor(
    private readonly validator: Validator,
    private readonly schema: JSONSchemaDefinition,
  ) {}

  /**
   * Executes a callback function in the context of a specific schema path.
   * This allows for validation against a sub-schema defined at the given path.
   * @param path - The path to the sub-schema, using JSON Pointer syntax.
   * @param callback - The callback function to execute within the scoped context.
   * @return A ValidationResult object containing the validity status and any errors.
   */
  runScopedSubSchema(path: string, callback: () => void): ValidationResult {
    const schema = this.getSubSchema(path);
    if (!schema) {
      throw new Error(`Schema not found at path: ${path}`);
    }

    const context = new ExecutionContext(this.validator, schema);

    callback();
    const result = context.toResult();
    this._scope = null;

    return result;
  }

  /**
   * Executes a callback function in a scoped context.
   * This allows for temporary changes to the execution context, such as enabling or disabling the error collection,
   * without affecting the global state of the validator.
   * @param callback - The callback function to execute within the scoped context.
   */
  runScoped(callback: () => void): ValidationResult {
    const previousScope = this._scope;
    this._scope = new ExecutionContext(this.validator, this.schema);

    callback();

    const result = this._scope.toResult();
    this._scope = previousScope;

    return result;
  }

  /**
   * Adds a validation error to the context.
   * If the context is scoped, the error is added to the scoped errors.
   * Otherwise, it is added to the global errors.
   * @param keyword - The keyword that caused the validation error.
   * @param params - The parameters associated with the validation error.
   * @param dataPath - The path to the data that caused the validation error.
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
        keyword,
        params,
      ),
    };

    // Overwrite the default message with a user-defined message if available
    error.message = this.validator.formatErrorMessage(error);

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

  /**
   * Retrieves the schema for a specific path.
   * This method allows access to the schema definition at a given path,
   * which can be useful for validation or error reporting.
   * @param path - The path to the schema, using JSON Pointer syntax.
   * @return The schema definition at the specified path, or null if not found.
   */
  private getSubSchema(path: string): JSONSchemaDefinition | null {
    const parts = path.split("/");
    let currentSchema: JSONSchemaDefinition | null = this.schema;

    for (const part of parts) {
      if (part === "" || part === "#") continue; // Skip root or empty parts
      if (currentSchema && typeof currentSchema === "object") {
        currentSchema = (currentSchema as JSONSchema)[part] || null;
      } else {
        return null; // Invalid path
      }
    }

    return currentSchema;
  }
}
