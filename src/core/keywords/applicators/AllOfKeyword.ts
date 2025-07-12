import * as t from "@babel/types";
import type { KeywordValidator } from "../../Keyword.ts";
import type { CompilationContext } from "../../Compiler.ts";
import type { JSONSchemaDefinition } from "../../../types";

const generateAllOfChecks = async (
  schemaValue: Array<JSONSchemaDefinition>,
  context: CompilationContext,
): Promise<t.Statement[]> => {
  const checks: t.Statement[] = [];

  for (const subSchema of schemaValue) {
    checks.push(
      t.ifStatement(
        t.memberExpression(
          context.executionContextIdentifier,
          t.identifier("valid"),
        ),
        // check which type can be applied to keyword, and check them before checking the keyword
        t.blockStatement(
          await context.compiler.createSchemaStatements(
            subSchema,
            context.options,
            context.schemaPath,
            context.dataPath,
            undefined,
          ),
        ),
      ),
    );
  }

  checks.push(
    t.ifStatement(
      t.unaryExpression(
        "!",
        t.memberExpression(
          context.executionContextIdentifier,
          t.identifier("valid"),
        ),
      ),
      t.blockStatement([context.fail({})]),
    ),
  );

  return checks;
};

export const AllOfKeyword: KeywordValidator = {
  keyword: "allOf",
  async code(schemaValue: unknown, context: CompilationContext) {
    if (!Array.isArray(schemaValue)) {
      throw new Error(
        `Invalid schema value for 'allOf': ${typeof schemaValue}`,
      );
    }

    const testedSchemas = schemaValue.filter((schema) => {
      return schema !== true && Object.keys(schema).length > 0;
    });

    if (testedSchemas.length === 0) {
      return t.emptyStatement();
    }

    return t.blockStatement(await generateAllOfChecks(testedSchemas, context));
  },
};
