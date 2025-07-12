import type { KeywordValidator } from "./Keyword.ts";

/**
 * The KeywordRegistry class manages the registration and retrieval of keyword validators.
 * It allows for registering keywords, retrieving them by name or type, and clearing the registry.
 */
export class KeywordRegistry {
  private _keywords: Map<string, KeywordValidator> = new Map();
  private _keywordsByType: Map<string, KeywordValidator[]> = new Map();

  constructor(initialKeywords: KeywordValidator[] = []) {
    for (const keyword of initialKeywords) {
      this.registerKeyword(keyword.keyword, keyword);
    }
  }

  /**
   * Registers a keyword validator.
   * @param keyword - The keyword to register.
   * @param validator - The validator function for the keyword.
   */
  registerKeyword(keyword: string, validator: KeywordValidator): void {
    if (this._keywords.has(keyword)) {
      throw new Error(`Keyword "${keyword}" is already registered.`);
    }

    this._keywords.set(keyword, validator);

    // Register the keyword by type if applicable
    if (validator.applicableTypes) {
      for (const type of validator.applicableTypes) {
        if (!this._keywordsByType.has(type)) {
          this._keywordsByType.set(type, []);
        }
        this._keywordsByType.get(type)?.push(validator);
      }
    }
  }

  /**
   * Retrieves a keyword validator by its name.
   * @param keyword - The keyword to retrieve.
   * @returns The keyword validator or undefined if not found.
   */
  getKeyword(keyword: string): KeywordValidator | undefined {
    return this._keywords.get(keyword);
  }

  /**
   * Retrieves all keyword validators applicable to a specific type.
   * @param type - The type for which to retrieve keyword validators.
   * @returns An array of keyword validators applicable to the specified type.
   */
  getKeywordsByType(type: string): KeywordValidator[] {
    return this._keywordsByType.get(type) || [];
  }

  /**
   * Clears all registered keywords.
   * This is typically used for testing purposes.
   */
  clear(): void {
    this._keywords.clear();
    this._keywordsByType.clear();
  }

  /**
   * Checks if a keyword is registered.
   * @param keyword - The keyword to check.
   * @returns True if the keyword is registered, false otherwise.
   */
  isKeywordRegistered(keyword: string): boolean {
    return this._keywords.has(keyword);
  }

  /**
   * Removes a keyword from the registry.
   * @param keyword - The keyword to remove.
   */
  removeKeyword(keyword: string): void {
    if (!this._keywords.has(keyword)) {
      throw new Error(`Keyword "${keyword}" is not registered.`);
    }

    this._keywords.delete(keyword);

    // Remove the keyword from applicable types
    for (const [type, validators] of this._keywordsByType.entries()) {
      const index = validators.findIndex((v) => v.keyword === keyword);
      if (index !== -1) {
        validators.splice(index, 1);
        if (validators.length === 0) {
          this._keywordsByType.delete(type);
        }
      }
    }
  }
}
