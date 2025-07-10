/**
 * Retrieves the value at a given path in an object.
 *
 * @param object - The object to query.
 * @param path - The path of the property to get, specified as a string with dot notation.
 * @returns The value at the specified path, or undefined if the path does not exist.
 */
export function get<T, V = unknown>(object: T, path: string): V | undefined {
  const keys = path.split(".");
  let result: any = object;

  for (const key of keys) {
    if (result && typeof result === "object" && key in result) {
      result = result[key];
    } else {
      return undefined;
    }
  }

  return result as V;
}
