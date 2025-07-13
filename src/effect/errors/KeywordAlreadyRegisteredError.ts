import { Data } from "effect";

export class KeywordAlreadyRegisteredError extends Data.TaggedError(
  "KeywordAlreadyRegisteredError",
) {}
