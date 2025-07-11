import type {
  CodeContext,
  JSONSchemaDefinition,
  KeywordValidator,
} from "../../../../types";
import * as t from "@babel/types";

export function generateAnyOf(
  anyOf: JSONSchemaDefinition[],
  ctx: CodeContext,
): t.Statement[] {
  const blocks: t.Statement[] = [];
  const validFound = t.identifier("validFound");
  blocks.push(
    t.variableDeclaration("let", [
      t.variableDeclarator(validFound, t.booleanLiteral(false)),
    ]),
  );

  for (const [index, schema] of anyOf.entries()) {
    if (!schema) continue;
    const code = ctx.compiler.getCodeForSchema(
      schema,
      `#/anyOf/${index}`,
      typeof schema === "object" && !("type" in schema),
    );

    blocks.push(
      t.ifStatement(
        t.unaryExpression("!", validFound),
        t.blockStatement([
          t.expressionStatement(
            t.callExpression(
              t.memberExpression(
                t.identifier("executionContext"),
                t.identifier("createScope"),
              ),
              [],
            ),
          ),
          ...code.body,
          t.ifStatement(
            t.memberExpression(
              t.identifier("executionContext"),
              t.identifier("valid"),
            ),
            t.blockStatement([
              t.expressionStatement(
                t.assignmentExpression("=", validFound, t.booleanLiteral(true)),
              ),
            ]),
          ),
          t.expressionStatement(
            t.callExpression(
              t.memberExpression(
                t.identifier("executionContext"),
                t.identifier("closeScope"),
              ),
              [],
            ),
          ),
        ]),
      ),
    );
  }

  blocks.push(t.ifStatement(t.unaryExpression("!", validFound), ctx.fail({})));

  return blocks;
}

export const AnyOfKeyword: KeywordValidator = {
  keyword: "anyOf",
  code(schemaValue, ctx) {
    if (!Array.isArray(schemaValue)) {
      throw new Error("anyOf must be an array");
    }
    return t.blockStatement(generateAnyOf(schemaValue, ctx));
  },
};
