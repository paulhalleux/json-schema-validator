import { describe, expect, test } from "bun:test";
import { Validator } from "../../../src/core/Validator.ts";
import type { JSONSchema } from "../../../src/types";

describe("keyword/assertion/maxLength", () => {
  const validator = new Validator({});

  const checks = [
    {
      name: "string with maxLength",
      schema: {
        type: "string",
        maxLength: 10,
      },
      validData: ["hello", "test", "1234567890"],
      invalidData: ["this is a very long string"],
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
