import type {
  JSONSchema,
  ValidationContext,
  ValidationError,
  ValidationResult,
} from "../types";
import type { Validator } from "./Validator.ts";
import { getTranslatedErrorMessage } from "../i18n";
import get from "lodash-es/get";

export class ExecutionContext {
  private _isScoped = false;
  private _scopedErrors: ValidationError[] = [];

  private readonly _errors: ValidationError[] = [];
  private readonly _refStack: Set<string> = new Set();

  constructor(
    private readonly schema: JSONSchema,
    private readonly validator: Validator,
  ) {}

  /**
   * Get the reference stack.
   * This property is used to track references during validation.
   */
  get refStack(): Set<string> {
    return this._refStack;
  }

  /**
   * Get the errors collected during validation.
   * This property is used to access validation errors after validation.
   */
  get valid(): boolean {
    const target = this._isScoped ? this._scopedErrors : this._errors;
    return target.length === 0;
  }

  /**
   * Get the data being validated.
   * This property is used to access the data during validation.
   */
  getSchemaAtPath(path: string): JSONSchema | undefined {
    const cleanedPath = path.replace(/^(#\/|\/)/, "");
    const pathArray = cleanedPath
      .split("/")
      .map((part) => (isNaN(Number(part)) ? part : Number(part)));

    return get(this.schema, pathArray);
  }

  /**
   * Add an error to the validation context.
   * This method is called when a validation error occurs.
   */
  addError(
    keyword: string,
    params: Record<string, any>,
    context: ValidationContext,
  ): void {
    const error: ValidationError = {
      keyword,
      params,
      dataPath: context.dataPath,
      schemaPath: context.schemaPath,
      message: getTranslatedErrorMessage(
        this.validator.options.locale,
        context.dataPath,
        keyword,
        params,
      ),
    };

    error.message = this.validator.formatErrorMessage(error, context);

    const target = this._isScoped ? this._scopedErrors : this._errors;
    target.push(error);
  }

  /**
   * Add multiple errors to the validation context.
   * This method is used to merge errors from multiple validation steps.
   */
  addErrors(errors: ValidationError[]): void {
    const target = this._isScoped ? this._scopedErrors : this._errors;
    target.push(...errors);
  }

  createScope() {
    if (this._isScoped) {
      throw new Error("Execution context is already scoped.");
    }
    this._isScoped = true;
    this._scopedErrors = [];
  }

  closeScope() {
    if (!this._isScoped) {
      throw new Error("Execution context is not scoped.");
    }
    this._isScoped = false;
    this._scopedErrors = [];
  }

  toValidationResult(): ValidationResult {
    return {
      valid: this._errors.length === 0,
      errors: this._errors,
    };
  }
}
