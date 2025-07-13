import { Data } from "effect";

export class UnsupportedDraftError extends Data.TaggedError(
  "UnsupportedDraftError",
) {
  constructor(public readonly version: string) {
    super();
  }
}
