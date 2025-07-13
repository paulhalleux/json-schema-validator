import { Context, Layer, Effect, Ref } from "effect";
import { FormatNotRegisteredError } from "../errors/FormatNotRegisteredError.ts";
import { FormatAlreadyRegisteredError } from "../errors/FormatAlreadyRegisteredError.ts";

export class FormatRegistry extends Context.Tag("FormatRegistry")<
  FormatRegistry,
  FormatRegistry.Proto
>() {
  static make = ({ formats: initialFormats = [] }: FormatRegistry.Options) => {
    return Layer.effect(
      FormatRegistry,
      Effect.gen(function* () {
        const formats = yield* Ref.make<
          Map<string, FormatRegistry.FormatValidator>
        >(new Map(initialFormats.map((f) => [f.name, f])));

        return {
          registerFormat: (validator: FormatRegistry.FormatValidator) => {
            return Effect.gen(function* () {
              const map = yield* Ref.get(formats);
              if (map.has(validator.name)) {
                return yield* Effect.fail(new FormatAlreadyRegisteredError());
              }
              yield* Ref.update(formats, (m) =>
                m.set(validator.name, validator),
              );
            });
          },
          getFormat: (name: string) => {
            return Effect.map(Ref.get(formats), (map) => map.get(name));
          },
          hasFormat: (name: string) => {
            return Effect.map(Ref.get(formats), (map) => map.has(name));
          },
          removeFormat: (name: string) => {
            return Effect.gen(function* () {
              const map = yield* Ref.get(formats);
              if (!map.has(name)) {
                return yield* Effect.fail(new FormatNotRegisteredError());
              }
              yield* Ref.update(formats, (m) => {
                m.delete(name);
                return m;
              });
            });
          },
          clear: () => Ref.set(formats, new Map()),
        };
      }),
    );
  };
}

export declare namespace FormatRegistry {
  interface Proto {
    registerFormat: (
      validator: FormatValidator,
    ) => Effect.Effect<void, FormatAlreadyRegisteredError>;
    getFormat: (name: string) => Effect.Effect<FormatValidator | undefined>;
    hasFormat: (name: string) => Effect.Effect<boolean>;
    removeFormat: (
      name: string,
    ) => Effect.Effect<void, FormatNotRegisteredError>;
    clear: () => Effect.Effect<void>;
  }

  interface Options {
    formats?: FormatValidator[];
  }

  export interface FormatValidator {
    readonly name: string;
    validate(value: string): boolean;
    compare?(a: string, b: string): number;
  }
}
