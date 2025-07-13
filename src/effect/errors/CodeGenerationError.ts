import { Data } from "effect";

export class CodeGenerationError extends Data.TaggedError(
  "CodeGenerationError",
) {
  constructor(
    public readonly keyword: string,
    message: string = "Error during code generation",
  ) {
    super();
    this.message = `${message} for keyword: ${keyword}`;
  }
}
