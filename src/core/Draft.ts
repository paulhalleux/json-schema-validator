import type { JSONSchema } from "../types";

import type { KeywordValidator } from "./Keyword";

/**
 * Enum representing the JSON Schema draft versions.
 */
export enum DraftVersion {
  Draft_2020_12 = "draft-2020-12",
}

/**
 * Represents a JSON Schema draft version.
 * This interface defines the structure and methods required for a JSON Schema draft.
 */
export interface Draft {
  /**
   * The version of the JSON Schema draft.
   * @default DraftVersion.Draft_2020_12
   */
  readonly version: DraftVersion;

  /**
   * A function to validate a JSON Schema.
   */
  getKeywords(): KeywordValidator[];

  /**
   * A function to normalize the schema.
   * @param schema - The JSON Schema to normalize.
   */
  normalize?(schema: JSONSchema): JSONSchema;
}
