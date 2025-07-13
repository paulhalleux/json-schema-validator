import { Data } from "effect";

export class FormatAlreadyRegisteredError extends Data.TaggedError(
  "FormatAlreadyRegistered",
) {}
