import type { KeywordValidator } from "./Keyword.ts";

/**
 * The KeywordRegistry class manages the registration and retrieval of keyword validators.
 * It allows for registering keywords, retrieving them by name or type, and clearing the registry.
 */
export class KeywordRegistry {
  private _keywords: Map<string, KeywordValidator> = new Map();

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
   * Clears all registered keywords.
   * This is typically used for testing purposes.
   */
  clear(): void {
    this._keywords.clear();
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
  }
}
