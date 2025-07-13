import { Context, Effect, Layer, Ref } from "effect";

import type { JSONSchemaDefinition } from "../../types";

import type { ExternalRefResolutionError } from "../errors/ExternalRefResolutionError.ts";
import { ExternalRefResolver } from "./ExternalRefResolver.ts";
import { LocalRefResolver } from "./LocalRefResolver.ts";

export class RefResolver extends Context.Tag("RefResolver")<
  RefResolver,
  RefResolver.Proto
>() {
  static readonly make = (options: RefResolver.Options = {}) => {
    return Layer.effect(
      RefResolver,
      Effect.gen(function* () {
        const cache = yield* Ref.make<Map<string, JSONSchemaDefinition>>(
          new Map(),
        );

        const local = yield* LocalRefResolver;
        const external = yield* ExternalRefResolver;

        return {
          resolveRef: (ref, rootSchema) =>
            Effect.gen(function* () {
              const cached = yield* Ref.get(cache);
              if (cached.has(ref)) return cached.get(ref);

              let resolved: JSONSchemaDefinition | undefined;

              if (ref.startsWith("#")) {
                resolved = local.resolveLocalRef(ref, rootSchema);
              } else {
                resolved = yield* external.resolveExternalRef(ref);
              }

              if (resolved) {
                yield* Ref.update(cache, (map) => map.set(ref, resolved!));
              }

              return resolved;
            }),
        };
      }),
    ).pipe(
      Layer.provide(LocalRefResolver.Live),
      Layer.provide(ExternalRefResolver.make(options)),
    );
  };
}

export declare namespace RefResolver {
  interface Proto {
    resolveRef: (
      ref: string,
      rootSchema: JSONSchemaDefinition,
    ) => Effect.Effect<
      JSONSchemaDefinition | undefined,
      ExternalRefResolutionError
    >;
  }

  interface Options extends ExternalRefResolver.Options {}
}
