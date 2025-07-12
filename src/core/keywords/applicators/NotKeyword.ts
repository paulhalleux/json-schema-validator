import * as t from "@babel/types";
import type { KeywordValidator } from "../../Keyword.ts";
import type { CompilationContext } from "../../Compiler.ts";
import { createScopedExecution } from "../../../utils/babel.ts";

export const NotKeyword: KeywordValidator = {
  keyword: "not",
  async code(schemaValue: unknown, context: CompilationContext) {
    if (
      typeof schemaValue !== "object" ||
      schemaValue === null ||
      Array.isArray(schemaValue)
    ) {
      throw new Error(`Invalid schema value for 'not': ${typeof schemaValue}`);
    }

    const scopeResult = t.identifier("scopeResult");
    return t.blockStatement([
      createScopedExecution(
        scopeResult,
        context.executionContextIdentifier,
        t.blockStatement(
          await context.compiler.createSchemaStatements(
            schemaValue,
            context.options,
            context.schemaPath,
            context.dataPath,
            undefined,
          ),
        ),
      ),
      t.ifStatement(
        t.memberExpression(scopeResult, t.identifier("valid")),
        t.blockStatement([context.fail({})]),
      ),
    ]);
  },
};
