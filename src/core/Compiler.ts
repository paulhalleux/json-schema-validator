import type { Validator } from "./Validator.ts";
import type { JSONSchema, JSONSchemaDefinition, ValidationFn } from "../types";
import * as t from "@babel/types";
import {
  createFactoryFunction,
  createFailCall,
  createValidationFunctionFactory,
} from "../utils/babel.ts";

export interface CompileOptions {
  /**
   * Whether to compile the schema asynchronously.
   * This option allows for asynchronous reference resolution.
   */
  async?: boolean;
}

export interface CompilationContext {
  /**
   * A reference stack used to track references during schema compilation.
   */
  refStack: Set<string>;

  /**
   * The root schema being compiled.
   */
  rootSchema: JSONSchemaDefinition;

  /**
   * The options used for compilation, such as whether to compile asynchronously.
   */
  options: CompileOptions;

  /**
   * The path to the schema being compiled.
   * This is used to identify the schema in error messages and validation results.
   */
  schemaPath: string;

  /**
   * The path to the data being validated.
   * This is used to identify the data in error messages and validation results.
   */
  dataPath: string;

  /**
   * A function to generate a failure statement for the validation.
   * This is used to create a statement that indicates a validation failure.
   *
   * @returns A Babel statement that represents the failure.
   */
  fail(params: Record<string, any>): t.Statement;

  /**
   * An identifier for the data being validated.
   * This can be used to reference the data in the generated validation function.
   */
  dataIdentifier: t.Identifier;

  /**
   * An identifier for the execution context.
   * This is used to access the execution context in the generated validation function.
   */
  executionContextIdentifier: t.Identifier;

  /**
   * The schema compiler instance that is used to compile the schema.
   * It can be used to compile sub-schemas or to access the validator.
   */
  compiler: Compiler;
}

const EXECUTION_CONTEXT_IDENTIFIER = t.identifier("executionContext");
const FACTORY_FUNCTION_IDENTIFIER = t.identifier("createValidationFunction");
const VALIDATOR_IDENTIFIER = t.identifier("validator");
const SCHEMA_IDENTIFIER = t.identifier("schema");
const DATA_IDENTIFIER = t.identifier("data");

/**
 * The Compiler class is responsible for compiling JSON Schemas.
 * It creates a validation function based on the provided schema and the validator.
 */
export class Compiler {
  protected readonly _validator: Validator;

  constructor(validator: Validator) {
    this._validator = validator;
  }

  /**
   * Compiles a JSON Schema into a validation function.
   * This method does not support asynchronous reference resolution unless specified in the options.
   * @param schema - The JSON Schema to compile.
   * @param options - Compilation options, such as whether to compile asynchronously.
   * @param schemaPath - The path to the schema being compiled, used for error reporting.
   * @param dataPath - The path to the data being validated, used for error reporting.
   * @return A synchronous validation function that can be used to validate data against the schema.
   */
  async compile(
    schema: JSONSchemaDefinition,
    options: CompileOptions = {},
    schemaPath: string = "#/",
    dataPath: string = "",
  ): Promise<ValidationFn> {
    const validationStatements = await this.createSchemaStatements(
      schema,
      options,
      schemaPath,
      dataPath,
      undefined,
    );

    const factoryFunction = createValidationFunctionFactory(
      FACTORY_FUNCTION_IDENTIFIER,
      EXECUTION_CONTEXT_IDENTIFIER,
      VALIDATOR_IDENTIFIER,
      SCHEMA_IDENTIFIER,
      DATA_IDENTIFIER,
      validationStatements,
    );

    const validatorFactory = createFactoryFunction(
      FACTORY_FUNCTION_IDENTIFIER,
      factoryFunction,
    );

    const validate = validatorFactory(this._validator, schema);
    return Object.assign(validate, {
      code: validatorFactory.code,
    });
  }

  /**
   * Creates an array of Babel statements that represent the compiled schema.
   * This method handles both boolean schemas and keyword schemas.
   *
   * @param schema - The JSON Schema to compile.
   * @param options - Compilation options, such as whether to compile asynchronously.
   * @param schemaPath - The path to the schema being compiled, used for error reporting.
   * @param dataPath - The path to the data being validated, used for error reporting.
   * @param type - The type of schema being compiled, either "string", "number", "boolean", etc.
   * @return An array of Babel statements representing the compiled schema.
   */
  async createSchemaStatements(
    schema: JSONSchemaDefinition,
    options: CompileOptions = {},
    schemaPath: string = "#/",
    dataPath: string = "",
    type: string | undefined,
  ): Promise<t.Statement[]> {
    const refStack = new Set<string>();
    if (typeof schema === "boolean") {
      const compilationContext = this.createCompilationContext(
        refStack,
        "boolean",
        undefined,
        schemaPath,
        dataPath,
        schema,
        options,
      );

      return this.compileBooleanSchema(compilationContext);
    } else {
      return await this.compileKeywordSchema(
        refStack,
        schema,
        options,
        schemaPath,
        dataPath,
        type,
      );
    }
  }

  /**
   * Compiles a keyword schema into validation statements.
   * This method generates statements based on the specific keyword and its associated schema.
   *
   * @param refStack - A set of references to track during compilation.
   * @param schema - The JSON Schema to compile, which should be an object.
   * @param options - Compilation options, such as whether to compile asynchronously.
   * @param schemaPath - The path to the schema being compiled, used for error reporting.
   * @param dataPath - The path to the data being validated, used for error reporting.
   * @param type - The type of schema being compiled, if applicable (e.g., "string", "number").
   * @return An array of Babel statements representing the compiled keyword schema.
   */
  private async compileKeywordSchema(
    refStack: Set<string>,
    schema: JSONSchemaDefinition,
    options: CompileOptions = {},
    schemaPath: string = "#/",
    dataPath: string = "",
    type: string | undefined,
  ) {
    if (typeof schema !== "object") {
      throw new Error(
        `Invalid schema to compile: expected an object, but received ${typeof schema}.`,
      );
    }

    const statements: t.Statement[] = [];

    for (let [keyword, subSchema] of Object.entries(schema)) {
      const compilationContext = this.createCompilationContext(
        refStack,
        "keyword",
        keyword,
        schemaPath,
        dataPath,
        schema,
        options,
      );

      const keywordValidator =
        this._validator.keywordRegistry.getKeyword(keyword);

      if (!keywordValidator) {
        continue; // Skip if no validator is found for the keyword
      }

      // Only compile if the keyword is applicable to the current type
      if (type && !keywordValidator.applicableTypes) {
        continue;
      }

      // Only compile global keywords if no type is specified
      if (!type && keywordValidator.applicableTypes) {
        continue;
      }

      // If a type is specified, check if the keyword is applicable to that type
      if (type && !keywordValidator.applicableTypes?.includes(type)) {
        continue;
      }

      const code = keywordValidator.code(subSchema, compilationContext);
      let compiledStatement: t.Statement;
      if (code instanceof Promise) {
        if (!compilationContext.options.async) {
          throw new Error(
            `Keyword "${keyword}" requires asynchronous compilation, but async mode is not enabled.`,
          );
        }
        compiledStatement = await code;
      } else {
        compiledStatement = code;
      }

      if (t.isStatement(compiledStatement)) {
        if (t.isBlockStatement(compiledStatement)) {
          statements.push(...compiledStatement.body);
        } else statements.push(compiledStatement);
      } else {
        throw new Error(
          `Invalid code generated for keyword "${keyword}": expected a Babel statement, but received ${typeof compiledStatement}.`,
        );
      }
    }

    return statements;
  }

  /**
   * Compiles a boolean schema into validation statements.
   * If the schema is true, no statements are generated.
   * If the schema is false, a failure statement is generated.
   *
   * @param compilationContext - The context containing the reference stack, root schema, and options.
   * @return An array of Babel statements representing the compiled schema.
   */
  private compileBooleanSchema(
    compilationContext: CompilationContext,
  ): t.Statement[] {
    if (typeof compilationContext.rootSchema === "object") {
      throw new Error(
        "Invalid schema to compile: expected a boolean value, but received an object.",
      );
    }

    if (compilationContext.rootSchema) {
      return [];
    } else {
      return [compilationContext.fail({})];
    }
  }

  /**
   * Creates a compilation context for the given root schema and options.
   * This context is used to track references and options during schema compilation.
   *
   * @param refStack - A set of references to track during compilation.
   * @param type - The type of schema being compiled, either "keyword" or "boolean".
   * @param keyword - The keyword associated with the schema, if applicable.
   * @param schemaPath - The path to the schema being compiled, used for error reporting.
   * @param dataPath - The path to the data being validated, used for error reporting.
   * @param rootSchema - The root schema being compiled.
   * @param options - Compilation options, such as whether to compile asynchronously.
   * @return A CompilationContext object containing the reference stack, root schema, and options.
   */
  private createCompilationContext(
    refStack: Set<string>,
    type: "keyword" | "boolean",
    keyword: string | undefined,
    schemaPath: string,
    dataPath: string,
    rootSchema: JSONSchemaDefinition,
    options: CompileOptions = {},
  ): CompilationContext {
    return {
      refStack,
      rootSchema,
      options,
      schemaPath,
      dataPath,
      dataIdentifier: DATA_IDENTIFIER,
      executionContextIdentifier: EXECUTION_CONTEXT_IDENTIFIER,
      compiler: this,
      fail: (params) => {
        return createFailCall(
          EXECUTION_CONTEXT_IDENTIFIER,
          DATA_IDENTIFIER,
          type === "boolean" ? String(rootSchema) : keyword || "default",
          dataPath,
          schemaPath,
          params,
        );
      },
    };
  }
}
