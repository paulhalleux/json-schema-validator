import { Data } from "effect";

export class KeywordNotRegisteredError extends Data.TaggedError(
  "KeywordNotRegisteredError",
) {}
