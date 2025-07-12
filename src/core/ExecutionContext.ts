import type { ValidationError, ValidationResult } from "../types";

export class ExecutionContext {
  private readonly _errors: ValidationError[] = [];

  private _isScoped: boolean;
  private _scope: ExecutionContext | null = null;

  constructor() {
    this._isScoped = false;
  }

  /**
   * Executes a callback function in a scoped context.
   * This allows for temporary changes to the execution context, such as enabling or disabling the error collection,
   * without affecting the global state of the validator.
   * @param callback
   */
  runScoped(callback: () => void): ValidationResult {
    const context = new ExecutionContext();
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
   * @param error - The validation error to add.
   */
  report(error: ValidationError) {
    if (this._scope) {
      this._scope.report(error);
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
