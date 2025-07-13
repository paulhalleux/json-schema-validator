import { Context, Effect, Layer } from "effect";
import type { JSONSchemaDefinition } from "../../types";

import { ExternalRefResolutionError } from "../errors/ExternalRefResolutionError.ts";

export class ExternalRefResolver extends Context.Tag("ExternalRefResolver")<
  ExternalRefResolver,
  ExternalRefResolver.Proto
>() {
  static readonly make = ({
    refResolver,
  }: ExternalRefResolver.Options = {}) => {
    return Layer.effect(
      ExternalRefResolver,
      Effect.sync(() => {
        return {
          resolveExternalRef(ref) {
            if (!refResolver) return Effect.succeed(undefined);
            return Effect.tryPromise({
              try: async () => {
                const result = refResolver(ref);
                return result instanceof Promise ? await result : result;
              },
              catch: () => new ExternalRefResolutionError(),
            });
          },
        };
      }),
    );
  };
}

export declare namespace ExternalRefResolver {
  export type Proto = {
    resolveExternalRef: (
      ref: string,
    ) => Effect.Effect<
      JSONSchemaDefinition | undefined,
      ExternalRefResolutionError
    >;
  };

  interface Options {
    refResolver?: RefResolverFn;
  }

  export type RefResolverFn = (
    ref: string,
  ) =>
    | Promise<JSONSchemaDefinition | undefined>
    | JSONSchemaDefinition
    | undefined;
}
