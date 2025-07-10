import type { FormatDefinition } from "../../types/format.ts";

export class FormatRegistry {
  private readonly formats: Map<string, FormatDefinition> = new Map();

  /**
   * Registers a format validator.
   * @param def - The format definition containing the name and validation function.
   */
  register(def: FormatDefinition): void {
    this.formats.set(def.name, def);
  }

  /**
   * Retrieves a format validator by its name.
   * @param name - The name of the format to retrieve.
   * @returns The format definition if found, otherwise undefined.
   */
  get(name: string): FormatDefinition | undefined {
    return this.formats.get(name);
  }

  /**
   * Removes a format validator by its name.
   * @param name - The name of the format to remove.
   */
  remove(name: string): void {
    this.formats.delete(name);
  }
}
