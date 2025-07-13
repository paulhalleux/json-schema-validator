import { Context, Effect, Layer, Ref } from "effect";
import type * as t from "@babel/types";

import { KeywordNotRegisteredError } from "../errors/KeywordNotRegisteredError.ts";
import { KeywordAlreadyRegisteredError } from "../errors/KeywordAlreadyRegisteredError.ts";
import type { CodeGenerationError } from "../errors/CodeGenerationError.ts";

import type { JSONSchemaTypeName } from "../types.ts";
import type { Compiler } from "./Compiler.ts";

export class KeywordRegistry extends Context.Tag("KeywordRegistry")<
  KeywordRegistry,
  KeywordRegistry.Proto
>() {
  static make = ({
    keywords: initialKeywords = [],
  }: KeywordRegistry.Options = {}): Layer.Layer<KeywordRegistry> =>
    Layer.effect(
      KeywordRegistry,
      Effect.gen(function* () {
        const keywords = yield* Ref.make<
          Map<string, KeywordRegistry.KeywordValidator>
        >(new Map(initialKeywords.map((kw) => [kw.keyword, kw])));

        return {
          registerKeyword: (validator) => {
            return Effect.gen(function* () {
              const map = yield* Ref.get(keywords);
              if (map.has(validator.keyword)) {
                return yield* Effect.fail(new KeywordAlreadyRegisteredError());
              }
              yield* Ref.update(keywords, (m) =>
                m.set(validator.keyword, validator),
              );
            });
          },
          getKeyword: (keyword) => {
            return Effect.map(Ref.get(keywords), (map) => map.get(keyword));
          },
          isKeywordRegistered: (keyword) => {
            return Effect.map(Ref.get(keywords), (map) => map.has(keyword));
          },
          removeKeyword: (keyword) => {
            return Effect.gen(function* () {
              const map = yield* Ref.get(keywords);
              if (!map.has(keyword)) {
                return yield* Effect.fail(new KeywordNotRegisteredError());
              }
              yield* Ref.update(keywords, (m) => {
                m.delete(keyword);
                return m;
              });
            });
          },
          clear: () => Ref.set(keywords, new Map()),
        };
      }),
    );
}

export declare namespace KeywordRegistry {
  interface Proto {
    registerKeyword: (
      validator: KeywordValidator,
    ) => Effect.Effect<void, KeywordAlreadyRegisteredError>;
    getKeyword: (
      keyword: string,
    ) => Effect.Effect<KeywordValidator | undefined>;
    isKeywordRegistered: (keyword: string) => Effect.Effect<boolean>;
    removeKeyword: (
      keyword: string,
    ) => Effect.Effect<void, KeywordNotRegisteredError>;
    clear: () => Effect.Effect<void>;
  }

  interface Options {
    keywords?: KeywordValidator[];
  }

  export interface KeywordValidator {
    readonly keyword: string;
    readonly applicableTypes?: JSONSchemaTypeName[];
    code: (
      schemaValue: unknown,
      context: Compiler.CompilationContext,
    ) => Effect.Effect<t.Statement, CodeGenerationError>;
  }
}
