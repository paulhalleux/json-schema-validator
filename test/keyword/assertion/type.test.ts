import { describe, expect, test } from "bun:test";
import { Validator } from "../../../src/core/Validator.ts";
import type { JSONSchema } from "../../../src/types";

describe("keyword/assertion/type", () => {
  const validator = new Validator({});

  describe("single type", () => {
    const types: Record<
      string,
      {
        validData: any[];
        invalidData: any[];
      }
    > = {
      string: {
        validData: ["hello", "", "test"],
        invalidData: [123, true, {}, [], null],
      },
      number: {
        validData: [1, -1, 0, 3.14],
        invalidData: ["1", true, {}, [], null],
      },
      integer: {
        validData: [1, -1, 0],
        invalidData: [1.1, "2", true, {}, [], null],
      },
      boolean: {
        validData: [true, false],
        invalidData: [1, "true", {}, [], null],
      },
      object: {
        validData: [{}, { a: 1 }],
        invalidData: [1, "{}", true, [], null],
      },
      array: {
        validData: [[], [1, 2, 3], ["a"]],
        invalidData: [1, "[]", true, {}, null],
      },
      null: {
        validData: [null],
        invalidData: [0, "", false, {}, [], undefined],
      },
    };

    describe.each(Object.keys(types))("type: %s", (type) => {
      const schema: JSONSchema = { type };
      const validate = validator.compile(schema);

      describe("valid data", () => {
        for (let validType of types[type]?.validData ?? []) {
          test(`valid type: ${validType}`, () => {
            expect(validate).toBeDefined();
            expect(validate).toBeInstanceOf(Function);
          });
        }
      });

      describe("invalid data", () => {
        for (let data of types[type]?.invalidData ?? []) {
          test(`invalid data: ${JSON.stringify(data)}`, () => {
            expect(validate(data).valid).toBe(false);
            expect(validate(data).errors).toHaveLength(1);
          });
        }
      });
    });
  });

  describe("multiple types", () => {
    const checks = [
      {
        name: "string or number",
        schema: { type: ["string", "number"] },
        validData: ["hello", 123, "", 0],
        invalidData: [true, {}, [], null],
      },
      {
        name: "string or boolean",
        schema: { type: ["boolean", "null"] },
        validData: [true, false, null],
        invalidData: [1, "true", {}, [], []],
      },
      {
        name: "object or array",
        schema: { type: ["object", "array"] },
        validData: [{}, [], { a: 1 }, [1, 2]],
        invalidData: [1, "{}", true, null],
      },
      {
        name: "null or integer",
        schema: { type: ["null", "integer"] },
        validData: [null, 0, -1, 42],
        invalidData: ["null", true, {}, [], 3.14],
      },
      {
        name: "string, number or boolean",
        schema: { type: ["string", "number", "boolean"] },
        validData: ["hello", 123, true, "", 0, false],
        invalidData: [{}, [], null],
      },
    ];

    for (let check of checks) {
      describe(`type: ${check.name}`, () => {
        const validate = validator.compile(check.schema);

        describe("valid data", () => {
          for (let validType of check.validData) {
            test(`valid type: ${JSON.stringify(validType)}`, () => {
              expect(validate).toBeDefined();
              expect(validate).toBeInstanceOf(Function);
              expect(validate(validType).valid).toBe(true);
            });
          }
        });

        describe("invalid data", () => {
          for (let data of check.invalidData) {
            test(`invalid data: ${JSON.stringify(data)}`, () => {
              expect(validate(data).valid).toBe(false);
              expect(validate(data).errors).toHaveLength(1);
            });
          }
        });
      });
    }
  });
});
