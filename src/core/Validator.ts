import type {
  JSONSchema,
  JSONSchemaDefinition,
  ValidationError,
  ValidationFn,
  ValidatorOptions,
} from "../types";

import { DraftVersion, type Draft } from "./Draft.ts";
import { DraftRegistry } from "./DraftRegistry.ts";
import { Compiler, type CompilationContext } from "./Compiler.ts";
import { KeywordRegistry } from "./KeywordRegistry.ts";
import { FormatRegistry } from "./FormatRegistry.ts";
import { RefResolver } from "./RefResolver.ts";
import { ExecutionContext } from "./ExecutionContext.ts";

/**
 * The Validator class is responsible for validating JSON Schemas against a specified draft version.
 * It uses a compiler to compile the schema and a keyword registry to manage keywords.
 */
export class Validator {
  private readonly _options: ValidatorOptions;
  private readonly _draft: Draft;
  private readonly _compiler: Compiler;
  private readonly _keywordRegistry: KeywordRegistry;
  private readonly _formatRegistry: FormatRegistry;
  private readonly _refResolver: RefResolver;

  constructor(options: ValidatorOptions) {
    this._options = getOptionsWithDefaults(options);
    this._draft = DraftRegistry.get(this._options.draftVersion);
    this._refResolver = new RefResolver(this._options.refResolver);
    this._keywordRegistry = new KeywordRegistry(this._draft.getKeywords());
    this._formatRegistry = new FormatRegistry();
    this._compiler = new Compiler(this);
  }

  get options(): ValidatorOptions {
    return this._options;
  }

  get keywordRegistry(): KeywordRegistry {
    return this._keywordRegistry;
  }

  get formatRegistry(): FormatRegistry {
    return this._formatRegistry;
  }

  /**
   * Compiles a JSON Schema into a validation function.
   * This method won't allow asynchronous reference resolution.
   * @param schema - The JSON Schema to compile.
   * @return A synchronous validation function that can be used to validate data against the schema.
   */
  compileSync(schema: JSONSchemaDefinition): ValidationFn {
    return this._compiler.compile(schema, { async: false });
  }

  /**
   * Compiles a JSON Schema into a validation function asynchronously.
   * This method allows for asynchronous reference resolution.
   *
   * @param schema - The JSON Schema to compile.
   * @return A promise that resolves to a synchronous validation function that can be used to validate data against the schema.
   */
  compileAsync(schema: JSONSchemaDefinition): Promise<ValidationFn> {
    const result = this._compiler.compile(schema, { async: true });
    if (result instanceof Promise) {
      return result;
    }
    return Promise.resolve(result);
  }

  /**
   * Resolves a reference to a schema.
   *
   * @param ref - The reference string to resolve.
   * @param compilationContext - The context for compilation, which includes the reference stack.
   * @return A promise that resolves to the corresponding JSONSchema, or undefined if the reference cannot be resolved.
   */
  resolveRef(
    ref: string,
    compilationContext: CompilationContext,
  ):
    | Promise<JSONSchemaDefinition | undefined>
    | JSONSchemaDefinition
    | undefined {
    if (typeof compilationContext.rootSchema !== "object") {
      throw new Error("Root schema must be an object to resolve references.");
    }

    const stack = compilationContext.refStack;
    if (stack.has(ref)) {
      if (this.options.circularRefPolicy === "throw") {
        throw new Error(`Circular reference detected: ${ref}`);
      } else {
        return undefined;
      }
    }

    stack.add(ref);

    return this._refResolver.resolveRef(ref, compilationContext.rootSchema);
  }

  /**
   * Formats an error message based on the provided ValidationError and ValidationContext.
   * This method uses the formatErrorMessages option if provided, otherwise it returns the default error message.
   *
   * @param error - The ValidationError to format.
   * @return A formatted error message string.
   */
  formatErrorMessage(error: ValidationError): string {
    if (this.options.formatErrorMessages) {
      return this.options.formatErrorMessages(error);
    }
    return error.message;
  }

  /**
   * Creates an execution context for validating a schema.
   * This context is used to manage the validation process, including error collection and reference resolution.
   *
   * @param schema - The JSON Schema to validate against.
   * @return An ExecutionContext instance that can be used to validate data against the schema.
   */
  createExecutionContext(schema: JSONSchemaDefinition) {
    return new ExecutionContext(this, schema);
  }
}

/**
 * Returns the options with default values applied.
 * This function ensures that all options have a value, using defaults where necessary.
 *
 * @param options - The options to apply defaults to.
 * @return An object containing the options with defaults applied.
 */
function getOptionsWithDefaults(options: ValidatorOptions = {}) {
  return {
    locale: options.locale || "en",
    draftVersion: options.draftVersion || DraftVersion.Draft_2020_12,
    normalizeSchema: options.normalizeSchema,
    refResolver: options.refResolver,
    disabledKeywords: options.disabledKeywords,
    enabledKeywords: options.enabledKeywords,
    formatErrorMessages: options.formatErrorMessages,
    circularRefPolicy: options.circularRefPolicy || "throw",
  };
}
