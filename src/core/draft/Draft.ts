import type { Validator } from "../Validator.ts";
import type { JSONSchema, KeywordValidator } from "../../types";
import { Draft202012 } from "./Draft202012.ts";

export const DraftVersion = {
  Draft_2020_12: "2020-12",
};

/**
 * Represent a JSONSchema Draft.
 */
export interface Draft {
  /**
   * The name of the draft.
   */
  version: string;

  /**
   * A function that returns the keywords supported by this draft.
   * @return An array of strings representing the keywords supported by this draft.
   */
  getKeywords(): KeywordValidator[];

  /**
   * A function that can be used to normalize the schema.
   * This is useful for ensuring that the schema conforms to the draft's requirements.
   * @param schema - The JSON schema to normalize.
   * @return The normalized JSON schema.
   */
  normalizeSchema?(schema: JSONSchema): JSONSchema;
}

/**
 * Returns a draft instance based on the specified version.
 *
 * @param version - The version of the draft to return.
 * @param validator - The validator instance to use with the draft.
 * @return An instance of the specified draft version.
 * @throws Error if the specified version is not supported.
 */
export function getDraft(version: string, validator: Validator): Draft {
  switch (version) {
    case DraftVersion.Draft_2020_12:
      return new Draft202012(validator);
    default:
      throw new Error(`Unsupported draft version: ${version}`);
  }
}
