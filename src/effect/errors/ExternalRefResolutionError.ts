import { Data } from "effect";

export class ExternalRefResolutionError extends Data.TaggedError(
  "ExternalRefResolutionError",
) {}
