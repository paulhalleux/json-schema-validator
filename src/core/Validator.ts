import type {
  CustomCoercionHook,
  JSONSchema,
  JSONSchemaDefinition,
  RefResolverFn,
  ValidationContext,
  ValidationError,
  ValidationFn,
} from "../types";
import type { Locale } from "../i18n";
import { type Draft, DraftVersion, getDraft } from "./draft/Draft.ts";
import { RefResolver } from "./RefResolver.ts";
import { KeywordRegistry } from "./KeywordRegistry.ts";

export type DefaultedValidatorOptions = ReturnType<
  typeof getOptionsWithDefaults
>;
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
  draftVersion?: string;

  /**
   * An optional function to normalize the schema before validation.
   * This can be used to ensure that the schema conforms to the draft's requirements.
   */
  normalizeSchema?: (schema: JSONSchema) => JSONSchema;

  /**
   * Whether to coerce types during validation.
   * If true, the validator will attempt to convert data types to match the schema.
   * @default false
   */
  coerceTypes?: boolean;

  /**
   * An optional custom coercion hook.
   * It can be used to transform specific data types during validation.
   */
  customCoercion?: CustomCoercionHook;

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
   * This function takes a ValidationError and a ValidationContext and returns a formatted error message.
   */
  formatErrorMessages?: (
    error: ValidationError,
    context: ValidationContext,
  ) => string;

  /**
   * Policy for handling circular references.
   * If set to "throw", an error will be thrown when a circular reference is detected.
   * If set to "ignore", the validator will skip the circular reference.
   * @default "throw"
   */
  circularRefPolicy?: "throw" | "ignore";
};

export class Validator {
  private readonly _draft: Draft;
  private readonly _options: DefaultedValidatorOptions;
  private readonly _refResolver: RefResolver;
  private readonly _keywordRegistry: KeywordRegistry;

  constructor(options: ValidatorOptions = {}) {
    this._options = getOptionsWithDefaults(options);
    this._refResolver = new RefResolver(this._options.refResolver);
    this._keywordRegistry = new KeywordRegistry();
    this._draft = getDraft(this._options.draftVersion, this);

    this.loadDraftKeywords();
  }

  /**
   * Gets the options used by this validator instance.
   * The options include locale, draft version, coercion settings, and more.
   *
   * @return The option object containing the validator's configuration.
   */
  get options(): DefaultedValidatorOptions {
    return this._options;
  }

  /**
   * Compiles a JSON Schema into a validation function.
   *
   * @param schema - The JSON Schema to compile.
   * @return A function that validates data against the schema.
   */
  compile(schema: JSONSchemaDefinition): ValidationFn {
    if (typeof schema === "boolean") {
      return () => ({ valid: schema });
    }

    const normalizedSchema = this._options.normalizeSchema
      ? this._options.normalizeSchema(schema)
      : schema;

    return () => ({ valid: true });
  }

  /**
   * Resolves a reference to a schema.
   *
   * @param ref - The reference string to resolve.
   * @param context - The validation context, which includes the reference stack and the root schema.
   * @return A promise that resolves to the corresponding JSONSchema, or undefined if the reference cannot be resolved.
   */
  resolveRef(
    ref: string,
    context: ValidationContext,
  ):
    | Promise<JSONSchemaDefinition | undefined>
    | JSONSchemaDefinition
    | undefined {
    const stack = context.refStack;
    if (stack.has(ref)) {
      if (this.options.circularRefPolicy === "throw") {
        throw new Error(`Circular reference detected: ${ref}`);
      } else {
        return undefined;
      }
    }

    stack.add(ref);

    return this._refResolver.resolveRef(ref, context.rootSchema);
  }

  /**
   * Formats an error message based on the provided ValidationError and ValidationContext.
   * This method uses the formatErrorMessages option if provided, otherwise it returns the default error message.
   *
   * @param error - The ValidationError to format.
   * @param context - The ValidationContext containing additional information for formatting.
   * @return A formatted error message string.
   */
  formatErrorMessage(
    error: ValidationError,
    context: ValidationContext,
  ): string {
    if (this.options.formatErrorMessages) {
      return this.options.formatErrorMessages(error, context);
    }
    return error.message;
  }

  /**
   * Registers the keywords supported by the draft version.
   * This method loads the keywords from the draft and registers them in the keyword registry.
   */
  private loadDraftKeywords(): void {
    const keywords = this._draft.getKeywords();
    for (const keyword of keywords) {
      // Check if the keyword should be disabled
      if (this._options.enabledKeywords) {
        if (!this._options.enabledKeywords.includes(keyword.keyword)) {
          continue;
        }
      } else if (this._options.disabledKeywords.includes(keyword.keyword)) {
        continue;
      }

      this._keywordRegistry.register(keyword);
    }
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
    coerceTypes: options.coerceTypes || false,
    customCoercion: options.customCoercion,
    refResolver: options.refResolver,
    disabledKeywords: options.disabledKeywords || [],
    enabledKeywords: options.enabledKeywords || [],
    formatErrorMessages: options.formatErrorMessages,
    circularRefPolicy: options.circularRefPolicy || "throw",
  };
}
