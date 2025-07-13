import { Effect } from "effect";
import * as t from "@babel/types";

import type { ExternalRefResolutionError } from "../errors/ExternalRefResolutionError.ts";

import { RefResolver } from "./RefResolver.ts";
import { ExecutionContext } from "../ExecutionContext.ts";
import { Translator } from "./Translator.ts";
import { KeywordRegistry } from "./KeywordRegistry.ts";
import { FormatRegistry } from "./FormatRegistry.ts";
import { DraftRegistry, DraftVersion } from "./DraftRegistry.ts";
import type { JSONSchemaDefinition, JSONSchemaTypeName } from "../types.ts";
import {
  createFactoryFunction,
  createFailCall,
  createValidationFunctionFactory,
} from "../utils/babel.ts";
import { InvalidSchemaTypeError } from "../errors/InvalidSchemaTypeError.ts";
import type { CodeGenerationError } from "../errors/CodeGenerationError.ts";

const EXECUTION_CONTEXT_IDENTIFIER = t.identifier("executionContext");
const FACTORY_FUNCTION_IDENTIFIER = t.identifier("createValidationFunction");
const COMPILER_IDENTIFIER = t.identifier("compiler");
const SCHEMA_IDENTIFIER = t.identifier("schema");
const DATA_IDENTIFIER = t.identifier("data");

export const CompilerProgram = {
  make: (options: Compiler.Options) => {
    return Effect.gen(function* () {
      const draftRegistry = yield* DraftRegistry;
      const refResolver = yield* RefResolver;
      const translator = yield* Translator;
      const keywordRegistry = yield* KeywordRegistry;
      const formatRegistry = yield* FormatRegistry;

      const draft = yield* draftRegistry.get(options.draft);

      for (let keyword of draft.getKeywords()) {
        yield* keywordRegistry.registerKeyword(keyword);
      }

      const compileBooleanSchema = (
        schema: JSONSchemaDefinition,
        refStack: Set<string>,
        schemaPath = "",
        dataPath = "",
      ): Effect.Effect<t.Statement[], InvalidSchemaTypeError> => {
        const compilationContext = createCompilationContext(
          compiler,
          refStack,
          "boolean",
          undefined,
          schemaPath,
          dataPath,
          schema,
        );

        if (typeof compilationContext.rootSchema === "object") {
          return Effect.fail(new InvalidSchemaTypeError("boolean"));
        }

        if (compilationContext.rootSchema) {
          return Effect.succeed([]);
        } else {
          return Effect.succeed([compilationContext.fail({})]);
        }
      };

      const compileObjectSchema = (
        schema: JSONSchemaDefinition,
        refStack: Set<string>,
        schemaPath = "",
        dataPath = "",
        schemaType?: JSONSchemaTypeName,
      ): Effect.Effect<
        t.Statement[],
        InvalidSchemaTypeError | CodeGenerationError
      > => {
        return Effect.gen(function* () {
          if (typeof schema !== "object") {
            return yield* Effect.fail(new InvalidSchemaTypeError("object"));
          }

          const normalizedSchema = draft.normalize?.(schema) || schema;
          const codes = Object.entries(normalizedSchema).map(
            ([keyword, keywordValue]) => {
              return Effect.gen(function* () {
                const compilationContext = createCompilationContext(
                  compiler,
                  refStack,
                  "keyword",
                  keyword,
                  schemaPath,
                  dataPath,
                  schema,
                );

                const keywordValidator =
                  yield* keywordRegistry.getKeyword(keyword);

                // Skip if no validator is found for the keyword
                if (!keywordValidator) {
                  return undefined;
                }

                // Only compile if the keyword is applicable to the current type
                if (schemaType && !keywordValidator.applicableTypes) {
                  return undefined;
                }

                // Only compile global keywords if no type is specified
                if (!schemaType && keywordValidator.applicableTypes) {
                  return undefined;
                }

                // If a type is specified, check if the keyword is applicable to that type
                if (
                  schemaType &&
                  !keywordValidator.applicableTypes?.includes(schemaType)
                ) {
                  return undefined;
                }

                return yield* keywordValidator.code(
                  keywordValue,
                  compilationContext,
                );
              });
            },
          );

          return yield* Effect.all(codes).pipe(
            Effect.map((statements) =>
              statements.filter((statement): statement is t.Statement =>
                Boolean(statement),
              ),
            ),
          );
        });
      };

      const compiler: Compiler.Proto = {
        compile(schema) {
          return Effect.gen(function* () {
            const validationStatements = yield* compiler.createSchemaStatements(
              schema,
              "#",
              "",
              undefined,
            );

            const factoryFunction = createValidationFunctionFactory(
              FACTORY_FUNCTION_IDENTIFIER,
              EXECUTION_CONTEXT_IDENTIFIER,
              COMPILER_IDENTIFIER,
              SCHEMA_IDENTIFIER,
              DATA_IDENTIFIER,
              validationStatements,
            );

            const validatorFactory = createFactoryFunction(
              FACTORY_FUNCTION_IDENTIFIER,
              factoryFunction,
            );

            const validate = validatorFactory(compiler, schema);
            return Object.assign(validate, {
              code: validatorFactory.code,
            });
          });
        },
        createSchemaStatements(
          schema,
          schemaPath = "",
          dataPath = "",
          schemaType,
        ) {
          return Effect.gen(function* () {
            const refStack = new Set<string>();

            if (typeof schema === "boolean") {
              return yield* compileBooleanSchema(
                schema,
                refStack,
                schemaPath,
                dataPath,
              );
            }

            return yield* compileObjectSchema(
              schema,
              refStack,
              schemaPath,
              dataPath,
              schemaType,
            );
          });
        },
        resolveRef(ref, compilationContext) {
          return refResolver.resolveRef(ref, compilationContext.rootSchema);
        },
        getErrorMessage(keyword, params, schemaValue) {
          return translator.translate(keyword, params, schemaValue);
        },

        // Non-effect scope methods, meant to be used in generated code
        createExecutionContext(schema) {
          return new ExecutionContext(schema);
        },
      };

      return compiler;
    });
  },
};

const createCompilationContext = (
  compiler: Compiler.Proto,
  refStack: Set<string>,
  type: "keyword" | "boolean",
  keyword: string | undefined,
  schemaPath: string,
  dataPath: string,
  rootSchema: JSONSchemaDefinition,
): Compiler.CompilationContext => {
  return {
    refStack,
    rootSchema,
    schemaPath,
    dataPath,
    dataIdentifier: DATA_IDENTIFIER,
    executionContextIdentifier: EXECUTION_CONTEXT_IDENTIFIER,
    compiler,
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
};

export declare namespace Compiler {
  interface Proto {
    compile(
      schema: JSONSchemaDefinition,
    ): Effect.Effect<
      ValidationFn,
      InvalidSchemaTypeError | CodeGenerationError
    >;

    createSchemaStatements(
      schema: JSONSchemaDefinition,
      schemaPath?: string,
      dataPath?: string,
      schemaType?: JSONSchemaTypeName,
    ): Effect.Effect<
      t.Statement[],
      InvalidSchemaTypeError | CodeGenerationError
    >;

    resolveRef(
      ref: string,
      compilationContext: Compiler.CompilationContext,
    ): Effect.Effect<
      JSONSchemaDefinition | undefined,
      ExternalRefResolutionError
    >;

    getErrorMessage(
      keyword: string,
      params: Translator.Params,
      schemaValue: unknown,
    ): Effect.Effect<string>;

    // Non-effect scope methods, meant to be used in generated code
    createExecutionContext(schema: JSONSchemaDefinition): ExecutionContext;
  }

  interface Options
    extends Translator.Options,
      RefResolver.Options,
      KeywordRegistry.Options,
      FormatRegistry.Options {
    draft: DraftVersion;
  }

  export interface CompilationContext {
    compiler: Compiler.Proto;
    refStack: Set<string>;
    rootSchema: JSONSchemaDefinition;
    schemaPath: string;
    dataPath: string;
    dataIdentifier: t.Identifier;
    executionContextIdentifier: t.Identifier;

    fail(params: Record<string, any>): t.Statement;
  }

  interface ValidationResult {
    valid: boolean;
    errors?: ValidationError[];
  }

  interface ValidationFn {
    (data: any): ValidationResult;

    code: string;
  }

  interface ValidationFnFactory {
    (compiler: Proto, schema: JSONSchemaDefinition): ValidationFn;

    code: string;
  }

  interface ValidationError {
    keyword: string | undefined;
    message: string;
    dataPath: string;
    schemaPath: string;
    data: any;
    parentSchema: JSONSchemaDefinition;
    schemaValue: unknown;
    params: Record<string, any>;
  }
}
