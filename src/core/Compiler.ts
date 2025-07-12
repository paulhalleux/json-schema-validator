import type { Validator } from "./Validator.ts";
import type { JSONSchema, JSONSchemaDefinition, ValidationFn } from "../types";
import * as t from "@babel/types";
import {
  createFactoryFunction,
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
   * A function to generate a failure statement for the validation.
   * This is used to create a statement that indicates a validation failure.
   *
   * @returns A Babel statement that represents the failure.
   */
  fail: (params: Record<string, string>) => t.Statement;
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

  compile(
    schema: JSONSchemaDefinition,
    options: { async: true },
  ): Promise<ValidationFn> | ValidationFn;
  compile(
    schema: JSONSchemaDefinition,
    options?: { async?: false },
  ): ValidationFn;

  /**
   * Compiles a JSON Schema into a validation function.
   * This method does not support asynchronous reference resolution unless specified in the options.
   * @param schema - The JSON Schema to compile.
   * @param options - Compilation options, such as whether to compile asynchronously.
   * @return A synchronous validation function that can be used to validate data against the schema.
   */
  compile(schema: JSONSchemaDefinition, options: CompileOptions = {}) {
    const refStack = new Set<string>();
    const validationStatements: t.Statement[] = [];

    if (typeof schema === "boolean") {
      const compilationContext = this.createCompilationContext(
        refStack,
        "boolean",
        undefined,
        schema,
        options,
      );
      validationStatements.push(
        ...this.compileBooleanSchema(compilationContext),
      );
    } else {
      // const compilationContext = this.createCompilationContext(
      //   refStack,
      //   "keyword",
      //   keyword,
      //   schema,
      //   options,
      // );
    }

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
   * @param rootSchema - The root schema being compiled.
   * @param options - Compilation options, such as whether to compile asynchronously.
   * @return A CompilationContext object containing the reference stack, root schema, and options.
   */
  private createCompilationContext(
    refStack: Set<string>,
    type: "keyword" | "boolean",
    keyword: string | undefined,
    rootSchema: JSONSchemaDefinition,
    options: CompileOptions = {},
  ): CompilationContext {
    return {
      refStack,
      rootSchema,
      options,
      fail: (params) => {
        if (type === "keyword") {
          // Generate a failure statement for a keyword schema
        }
        // Generate a failure statement for a boolean schema
        return t.returnStatement(t.booleanLiteral(false));
      },
    };
  }
}
