import { Context, Effect, Layer } from "effect";
import type { JSONSchemaDefinition } from "../types";

export class LocalRefResolver extends Context.Tag("LocalRefResolver")<
  LocalRefResolver,
  LocalRefResolver.Proto
>() {
  static Live = Layer.effect(
    LocalRefResolver,
    Effect.sync(() => {
      return {
        resolveLocalRef(ref, rootSchema) {
          if (!ref.startsWith("#")) return undefined;
          const path = ref
            .slice(1)
            .split("/")
            .filter(Boolean)
            .map(decodeURIComponent);

          let current: JSONSchemaDefinition = rootSchema;
          for (const segment of path) {
            if (current && typeof current === "object" && segment in current) {
              current = current[segment];
            } else {
              return undefined;
            }
          }
          return current;
        },
      };
    }),
  );
}

export declare namespace LocalRefResolver {
  interface Proto {
    resolveLocalRef: (
      ref: string,
      rootSchema: JSONSchemaDefinition,
    ) => JSONSchemaDefinition | undefined;
  }
}
