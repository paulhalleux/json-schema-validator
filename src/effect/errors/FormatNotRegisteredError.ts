import { Data } from "effect";

export class FormatNotRegisteredError extends Data.TaggedError(
  "FormatNotRegistered",
) {}
