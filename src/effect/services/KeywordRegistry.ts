import { Context, Effect, Layer, Ref } from "effect";
import type { JSONSchemaTypeName } from "../../types";
import type { CompilationContext } from "../../core/Compiler.ts";
import { KeywordNotRegisteredError } from "../errors/KeywordNotRegisteredError.ts";
import { KeywordAlreadyRegisteredError } from "../errors/KeywordAlreadyRegisteredError.ts";
import type * as t from "@babel/types";
import type { CodeGenerationError } from "../errors/CodeGenerationError.ts";

export class KeywordRegistry extends Context.Tag("KeywordRegistry")<
  KeywordRegistry,
  KeywordRegistry.Proto
>() {
  static make = ({
    initialKeywords = [],
  }: KeywordRegistry.Options = {}): Layer.Layer<KeywordRegistry> =>
    Layer.effect(
      KeywordRegistry,
      Effect.gen(function* () {
        const keywords = yield* Ref.make<
          Map<string, KeywordRegistry.KeywordValidator>
        >(new Map());

        // preload initial keywords
        for (const kw of initialKeywords) {
          yield* Ref.update(keywords, (map) => map.set(kw.keyword, kw));
        }

        return {
          registerKeyword: (keyword, validator) => {
            return Effect.gen(function* () {
              const map = yield* Ref.get(keywords);
              if (map.has(keyword)) {
                return yield* Effect.fail(new KeywordAlreadyRegisteredError());
              }
              yield* Ref.update(keywords, (m) => m.set(keyword, validator));
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
      keyword: string,
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
    initialKeywords?: KeywordValidator[];
  }

  export interface KeywordValidator {
    readonly keyword: string;
    readonly applicableTypes?: JSONSchemaTypeName[];
    code: (
      schemaValue: unknown,
      context: CompilationContext,
    ) => Effect.Effect<CodeGenerationError, t.Statement>;
  }
}
