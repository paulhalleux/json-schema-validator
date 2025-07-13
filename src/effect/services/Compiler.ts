import { Context, Effect, Layer } from "effect";
import * as t from "@babel/types";

import type { JSONSchemaDefinition, ValidationFn } from "../../types";

import type { ExternalRefResolutionError } from "../errors/ExternalRefResolutionError.ts";

import { RefResolver } from "./RefResolver.ts";
import { ExecutionContext } from "../ExecutionContext.ts";
import { Translator } from "./Translator.ts";
import { KeywordRegistry } from "./KeywordRegistry.ts";
import { FormatRegistry } from "./FormatRegistry.ts";

export const CompilerProgram = Effect.gen(function* () {
  const refResolver = yield* RefResolver;
  const translator = yield* Translator;
  const keywordRegistry = yield* KeywordRegistry;
  const formatRegistry = yield* FormatRegistry;

  const compiler: Compiler.Proto = {
    compile(schema) {
      return Effect.succeed(
        Object.assign(() => ({ valid: true, errors: [] }), { code: "" }),
      );
    },
    createSchemaStatements(
      schema,
      schemaPath = "",
      dataPath = "",
      type = "object",
    ) {
      return Effect.succeed([]);
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

export declare namespace Compiler {
  interface Proto {
    compile(schema: JSONSchemaDefinition): Effect.Effect<ValidationFn>;
    createSchemaStatements(
      schema: JSONSchemaDefinition,
      schemaPath?: string,
      dataPath?: string,
      type?: string,
    ): Effect.Effect<t.Statement[]>;
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
      FormatRegistry.Options {}

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
}
