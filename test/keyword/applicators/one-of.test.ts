import { describe, expect, test } from "bun:test";
import { Validator } from "../../../src/core/Validator.ts";

describe("keyword/assertion/oneOf", () => {
  const validator = new Validator({});

  const checks = [
    {
      name: "string or number or string with minLength",
      schema: {
        oneOf: [
          { type: "string" },
          { type: "number" },
          { type: "string", minLength: 3 },
        ],
      },
      validData: ["he", 123],
      invalidData: ["hello"],
    },
  ];

  for (const check of checks) {
    const { name, schema, validData, invalidData } = check;
    const validate = validator.compile(schema);

    describe(name, () => {
      describe("valid data", () => {
        for (const data of validData) {
          test(`valid data: ${JSON.stringify(data)}`, () => {
            console.log(validate(data));
            expect(validate(data).valid).toBe(true);
          });
        }
      });

      describe("invalid data", () => {
        for (const data of invalidData) {
          test(`invalid data: ${JSON.stringify(data)}`, () => {
            expect(validate(data).valid).toBe(false);
          });
        }
      });
    });
  }
});
