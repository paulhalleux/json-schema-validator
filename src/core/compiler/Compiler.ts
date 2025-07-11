import type {
  CodeContext,
  JSONSchemaDefinition,
  ValidationFn,
} from "../../types";
import * as t from "@babel/types";
import { generate } from "@babel/generator";
import { Validator } from "../Validator.ts";
import type { Statement } from "@babel/types";
import {
  createExecutionContextDeclaration,
  createFailFunction,
  createValidationContext,
  createValidationReturn,
} from "../../utils/compile.ts";

export class Compiler {
  constructor(private readonly validator: Validator) {}

  getCodeForSchema(schema: JSONSchemaDefinition, path: string, full = false) {
    if (typeof schema === "boolean") {
      return t.blockStatement([t.returnStatement(t.booleanLiteral(schema))]);
    }

    const checks: t.Statement[] = [createValidationContext("", path)];

    for (let entry of Object.entries(schema)) {
      const [keyword, value] = entry;
      const validationKeyword = this.validator.keywordRegistry.get(keyword);
      if (
        !validationKeyword ||
        !validationKeyword.code ||
        (validationKeyword.applyTo && !full)
      ) {
        continue;
      }

      const context: CodeContext = {
        schema,
        schemaPath: path,
        validator: this.validator,
        compiler: this,
        fail(params: Record<string, any>): Statement {
          return createFailFunction(keyword, value, params);
        },
      };

      const result = validationKeyword.code(value, context);
      const statements = Array.isArray(result) ? result : [result];
      if (statements.length > 0) {
        checks.push(...statements);
      }
    }

    return t.blockStatement(checks);
  }

  compile(schema: JSONSchemaDefinition, path = "#"): ValidationFn {
    const checks = [
      createExecutionContextDeclaration(),
      ...this.getCodeForSchema(schema, path).body,
      createValidationReturn(),
    ];

    // Create the factory function that will create the validation function
    const fn = t.functionDeclaration(
      t.identifier("createValidateFunction"),
      [t.identifier("validator"), t.identifier("schema")],
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

    const validator = new Function(functionBody)()(this.validator, schema);
    return Object.assign(validator, { code: functionBody });
  }
}
