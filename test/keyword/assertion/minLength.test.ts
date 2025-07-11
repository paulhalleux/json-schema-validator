import { describe, expect, test } from "bun:test";
import { Validator } from "../../../src/core/Validator.ts";
import type { JSONSchema } from "../../../src/types";

describe("keyword/assertion/minLength", () => {
  const validator = new Validator({});

  const checks = [
    {
      name: "string with minLength",
      schema: {
        type: "string",
        minLength: 3,
      },
      validData: ["hello", "test"],
      invalidData: ["", "hi"],
    },
  ];

  for (const check of checks) {
    const { name, schema, validData, invalidData } = check;
    const validate = validator.compile(schema);

    describe(name, () => {
      describe("valid data", () => {
        for (const data of validData) {
          test(`valid data: ${JSON.stringify(data)}`, () => {
            expect(validate(data).valid).toBe(true);
          });
        }
      });

      describe("invalid data", () => {
        for (const data of invalidData) {
          test(`invalid data: ${JSON.stringify(data)}`, () => {
            expect(validate(data).valid).toBe(false);
            expect(validate(data).errors).toHaveLength(1);
          });
        }
      });
    });
  }
});
