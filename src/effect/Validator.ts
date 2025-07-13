import { Effect, Layer } from "effect";

import { type Compiler, CompilerProgram } from "./services/Compiler.ts";
import { RefResolver } from "./services/RefResolver.ts";
import { Translator } from "./services/Translator.ts";
import { KeywordRegistry } from "./services/KeywordRegistry.ts";
import { FormatRegistry } from "./services/FormatRegistry.ts";

import { DraftRegistry } from "./services/DraftRegistry.ts";
import type { JSONSchemaDefinition } from "./types.ts";

interface ValidatorOptions extends Compiler.Options {}

export const Validator = {
  make: (options: ValidatorOptions) => {
    const compiler = Effect.runSync(
      Effect.provide(
        CompilerProgram.make(options),
        Layer.mergeAll(
          RefResolver.make(options),
          Translator.make(options),
          KeywordRegistry.make(options),
          FormatRegistry.make(options),
          DraftRegistry.Live,
        ),
      ),
    );

    return {
      compileAsync(schema: JSONSchemaDefinition) {
        return Effect.runPromise(compiler.compile(schema));
      },
      compileSync(schema: JSONSchemaDefinition) {
        return Effect.runSync(compiler.compile(schema));
      },
    };
  },
};
