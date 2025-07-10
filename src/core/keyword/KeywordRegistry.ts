import type { KeywordValidator } from "../../types";

export class KeywordRegistry {
  private readonly keywords: Map<string, KeywordValidator> = new Map();
  private readonly keywordByType: Map<string, KeywordValidator[]> = new Map();

  /**
   * Registers a keyword validator.
   * @param validator - The keyword validator to register.
   */
  register(validator: KeywordValidator): void {
    this.keywords.set(validator.keyword, validator);

    // Register the validator for all applicable types
    if (validator.applyTo) {
      for (const type of validator.applyTo) {
        if (!this.keywordByType.has(type)) {
          this.keywordByType.set(type, []);
        }
        this.keywordByType.get(type)?.push(validator);
      }
    }
  }

  /**
   * Retrieves a keyword validator by its name.
   * @param keyword - The name of the keyword to retrieve.
   * @returns The keyword validator if found, otherwise undefined.
   */
  get(keyword: string): KeywordValidator | undefined {
    return this.keywords.get(keyword);
  }

  /**
   * Retrieves all keyword validators applicable to a specific type.
   * @param type - The JSON Schema type to retrieve validators for.
   * @returns An array of keyword validators applicable to the specified type.
   */
  getByType(type: string): KeywordValidator[] {
    return this.keywordByType.get(type) || [];
  }

  /**
   * Removes a keyword validator by its name.
   * @param keyword - The name of the keyword to remove.
   */
  remove(keyword: string): void {
    this.keywords.delete(keyword);
    this.keywordByType.forEach((validators, type) => {
      this.keywordByType.set(
        type,
        validators.filter((v) => v.keyword !== keyword),
      );
    });
  }
}
