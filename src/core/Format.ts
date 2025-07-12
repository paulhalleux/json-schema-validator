import type { Locale } from "../i18n";

/**
 * Represents the parameters used for format validation.
 * These parameters can include minimum and maximum values, as well as exclusive minimum and maximum values.
 * Additional parameters can be added as needed.
 */
export type FormatParams = {
  formatMinimum?: string;
  formatMaximum?: string;
  formatExclusiveMinimum?: string;
  formatExclusiveMaximum?: string;
  [key: string]: string | undefined;
};

/**
 * Represents a validator for a specific format.
 * This interface defines the structure and methods required for a format validator.
 */
export interface FormatValidator {
  /**
   * The name of the format.
   */
  readonly name: string;

  /**
   * A function that returns an error message for the format.
   * @param locale - The locale to use for the error message.
   * @param keyword - The keyword that failed validation (e.g., "format", "formatMinimum", etc.).
   * @param params - The parameters for the format validation.
   */
  getErrorMessage(
    locale: Locale,
    keyword: keyof FormatParams,
    params: FormatParams,
  ): string;

  /**
   * A function that validates if a given value conforms to the format.
   * @param value - The value to validate.
   * @returns `true` if the value is valid, otherwise `false`.
   */
  validate(value: string): boolean;

  /**
   * An optional function to compare two values of the format.
   *
   * This is used when formatMinimum, formatMaximum, formatExclusiveMinimum, or formatExclusiveMaximum
   * are specified in the format parameters.
   *
   * @param a - The first value to compare.
   * @param b - The second value to compare.
   * @return A negative number if `a` is less than `b`, zero if they are equal, or a positive number if `a` is greater than `b`.
   */
  compare?(a: string, b: string): number;
}
