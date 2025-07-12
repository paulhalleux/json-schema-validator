import type {
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

  compile(schema: JSONSchemaDefinition): ValidationFn {
    throw new Error("Not implemented: compile method in Validator class");
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
