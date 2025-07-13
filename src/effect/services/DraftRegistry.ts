import { Context, Effect, Layer } from "effect";

import { Draft_2020_12 } from "../drafts/Draft_2020_12.ts";
import { UnsupportedDraftError } from "../errors/UnsupportedDraftError.ts";
import type { KeywordRegistry } from "./KeywordRegistry.ts";
import type { JSONSchema } from "../types.ts";

export class DraftRegistry extends Context.Tag("DraftRegistry")<
  DraftRegistry,
  DraftRegistry.Proto
>() {
  static readonly Live = Layer.effect(
    DraftRegistry,
    Effect.gen(function* () {
      return {
        get(version) {
          if (!version || version === DraftVersion.Draft_2020_12) {
            return Effect.succeed(new Draft_2020_12());
          }
          return Effect.fail(new UnsupportedDraftError(version));
        },
      };
    }),
  );
}

export enum DraftVersion {
  Draft_2020_12 = "draft-2020-12",
  Draft_2019_09 = "draft-2019-09",
  Draft_07 = "draft-07",
}

export declare namespace DraftRegistry {
  export interface Proto {
    get(version?: DraftVersion): Effect.Effect<Draft, UnsupportedDraftError>;
  }

  export interface Draft {
    readonly version: DraftVersion;
    getKeywords(): KeywordRegistry.KeywordValidator[];
    normalize?(schema: JSONSchema): JSONSchema;
  }
}
