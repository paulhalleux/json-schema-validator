import type {
  CodeContext,
  JSONSchemaDefinition,
  ValidationFn,
} from "../../types";
import * as t from "@babel/types";
import { generate } from "@babel/generator";
import { parse } from "@babel/parser";
import { Validator } from "../Validator.ts";
import type { Statement } from "@babel/types";
import {
  createExecutionContextDeclaration,
  createFailFunction,
  createValidationReturn,
} from "../../utils/codegen.ts";

export class Compiler {
  constructor(private readonly validator: Validator) {}

  compile(schema: JSONSchemaDefinition, path = "#"): ValidationFn {
    if (typeof schema === "boolean") {
      return Object.assign(() => ({ valid: schema }), { code: "" });
    }

    const checks: t.Statement[] = [createExecutionContextDeclaration()];

    for (let entry of Object.entries(schema)) {
      const [keyword, value] = entry;
      const validationKeyword = this.validator.keywordRegistry.get(keyword);
      if (!validationKeyword || !validationKeyword.code) {
        continue;
      }

      const context: CodeContext = {
        fail(params: Record<string, any>): Statement {
          return createFailFunction(keyword, value, params, "", path);
        },
      };

      const result = validationKeyword.code(value, path, context);
      const statements = Array.isArray(result) ? result : [result];
      if (statements.length > 0) {
        checks.push(...statements);
      }
    }

    // Default return true
    checks.push(createValidationReturn());

    // Create the factory function that will create the validation function
    const fn = t.functionDeclaration(
      t.identifier("createValidateFunction"),
      [
        t.identifier("validator"),
        t.identifier("compiler"),
        t.identifier("schema"),
      ],
      t.blockStatement([
        t.returnStatement(
          t.arrowFunctionExpression(
            [t.identifier("data")],
            t.blockStatement(checks),
          ),
        ),
      ]),
    );

    const { code } = generate(fn);
    const functionBody = `"use strict";\n${code};\nreturn createValidateFunction;`;

    const validator = new Function(functionBody)()(
      this.validator,
      this,
      schema,
    );
    return Object.assign(validator, { code: functionBody });
  }
}
