import { Data } from "effect";

export class InvalidSchemaTypeError extends Data.TaggedError(
  "InvalidSchemaTypeError",
) {
  constructor(public readonly expected: "object" | "boolean") {
    super();
  }
}
