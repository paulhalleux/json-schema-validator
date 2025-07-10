import { expect, test, describe } from "bun:test";

import { Compiler } from "./Compiler";
import { Validator } from "../Validator";

describe("Compiler", () => {
  describe("type", () => {
    test("should compile a schema with 'type' keyword", () => {
      const validator = new Validator({});
      const compiled = new Compiler(validator).compile({
        type: ["string", "number"],
      });

      console.log(compiled.code);

      expect(compiled("test data")).toEqual({
        valid: true,
        errors: [],
      });
      expect(compiled(123)).toEqual({ valid: true, errors: [] });
      expect(compiled(true)).toEqual({
        valid: false,
        errors: [
          {
            keyword: "type",
            params: { keyword: "type", type: ["string", "number"] },
            dataPath: "",
            schemaPath: "#",
            message: "must pass 'type' validation",
          },
        ],
      });
    });
  });

  describe("allOf", () => {
    test('should compile a schema with "allOf" keyword', () => {
      const validator = new Validator({});
      const compiled = new Compiler(validator).compile({
        allOf: [{ type: "string" }, { minLength: 3 }],
      });

      console.log(compiled.code);

      expect(compiled("test")).toEqual({
        valid: true,
        errors: [],
      });
      expect(compiled("ab")).toEqual({
        valid: false,
        errors: [
          {
            keyword: "minLength",
            params: { keyword: "minLength", limit: 3 },
            dataPath: "",
            schemaPath: "#/allOf/1",
            message: "must pass 'minLength' validation",
          },
        ],
      });
    });
  });
});
