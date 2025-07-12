/**
 * FormatRegistry is a class that manages a collection of format validators.
 * It allows registering, retrieving, checking, and removing format validators by name.
 * This is useful for validating data formats in various applications.
 */
export class FormatRegistry {
  private readonly _formats: Map<string, (value: string) => boolean>;

  constructor() {
    this._formats = new Map();
  }

  /**
   * Registers a format validator.
   * @param name - The name of the format.
   * @param validator - The function that validates the format.
   */
  registerFormat(name: string, validator: (value: string) => boolean): void {
    if (this._formats.has(name)) {
      throw new Error(`Format "${name}" is already registered.`);
    }
    this._formats.set(name, validator);
  }

  /**
   * Retrieves a format validator by its name.
   * @param name - The name of the format to retrieve.
   * @returns The format validator function or undefined if not found.
   */
  getFormat(name: string): ((value: string) => boolean) | undefined {
    return this._formats.get(name);
  }

  /**
   * Checks if a format is registered.
   * @param name - The name of the format to check.
   * @returns `true` if the format is registered, otherwise `false`.
   */
  hasFormat(name: string): boolean {
    return this._formats.has(name);
  }

  /**
   * Clears all registered formats.
   * This is typically used for testing purposes.
   */
  clear(): void {
    this._formats.clear();
  }

  /**
   * Removes a format from the registry.
   * @param name - The name of the format to remove.
   * @throws Error if the format is not registered.
   */
  removeFormat(name: string): void {
    if (!this._formats.has(name)) {
      throw new Error(`Format "${name}" is not registered.`);
    }
    this._formats.delete(name);
  }
}
