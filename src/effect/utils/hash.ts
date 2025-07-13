/**
 * Generates a random hash string.
 * This function uses the `crypto` API to create a random hash.
 * @return {string} A hexadecimal string representing the hash.
 */
export function createHash(): string {
  const hashArray = new Uint32Array(1);
  crypto.getRandomValues(hashArray);
  return Array.from(hashArray)
    .map((num) => num.toString(16).padStart(8, "0"))
    .join("");
}
