import type { CoercionEntry, CustomCoercionHook } from "../types";

/**
 * Coerces a value to the expected type, logging the coercion process.
 *
 * @param expectedType - The type to coerce the value to (e.g., "number", "string", "boolean", etc.).
 * @param value - The value to be coerced.
 * @param path - The path in the schema where the coercion is occurring.
 * @param log - An array to log coercion entries.
 * @param customHook - An optional custom coercion hook function.
 * @returns The coerced value.
 */
export function coerceValue(
  expectedType: string,
  value: any,
  path: string,
  log: CoercionEntry[] = [],
  customHook?: CustomCoercionHook,
): any {
  if (customHook) {
    const result = customHook(value, expectedType, path);
    if (result !== undefined && result !== value) {
      log.push({
        path,
        from: typeof value,
        to: expectedType,
        original: value,
        coerced: result,
      });
      return result;
    }
  }

  const originalType = typeof value;
  let coerced: any = value;

  switch (expectedType) {
    case "number":
      if (typeof value === "string" && !isNaN(Number(value)))
        coerced = Number(value);
      break;
    case "integer":
      if (typeof value === "string" && /^-?\d+$/.test(value))
        coerced = parseInt(value, 10);
      break;
    case "boolean":
      if (value === "true") coerced = true;
      else if (value === "false") coerced = false;
      break;
    case "null":
      if (value === "" || value === "null") coerced = null;
      break;
    case "array":
      if (typeof value === "string") {
        try {
          const parsed = JSON.parse(value);
          if (Array.isArray(parsed)) coerced = parsed;
        } catch {}
      }
      if (Array.isArray(coerced)) {
        coerced = coerced.map((item, i) =>
          typeof item === "string"
            ? coerceValue("string", item, `${path}/${i}`, log, customHook)
            : item,
        );
      }
      break;
    case "object":
      if (typeof value === "string") {
        try {
          const parsed = JSON.parse(value);
          if (parsed && typeof parsed === "object" && !Array.isArray(parsed))
            coerced = parsed;
        } catch {}
      }
      if (coerced && typeof coerced === "object" && !Array.isArray(coerced)) {
        for (const key in coerced) {
          coerced[key] =
            typeof coerced[key] === "string"
              ? coerceValue(
                  "string",
                  coerced[key],
                  `${path}/${key}`,
                  log,
                  customHook,
                )
              : coerced[key];
        }
      }
      break;
  }

  if (coerced !== value) {
    log.push({
      path,
      from: originalType,
      to: expectedType,
      original: value,
      coerced,
    });
  }

  return coerced;
}
