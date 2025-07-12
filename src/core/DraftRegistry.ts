import { type Draft, DraftVersion } from "./Draft.ts";
import { Draft_2020_12 } from "./drafts/Draft_2020_12.ts";

/**
 * The DraftRegistry class manages the registration and retrieval of draft versions.
 * It allows for getting a draft version based on the provided version identifier.
 */
export class DraftRegistry {
  /**
   * Retrieves a draft instance based on the provided version.
   * If no version is specified, it defaults to Draft_2020_12.
   * @param version - The draft version to retrieve.
   * @returns An instance of the specified draft version.
   */
  static get(version: DraftVersion | undefined): Draft {
    if (!version) {
      return new Draft_2020_12();
    }

    switch (version) {
      case DraftVersion.Draft_2020_12:
        return new Draft_2020_12();
      default:
        throw new Error(`Unsupported draft version: ${version}`);
    }
  }
}
