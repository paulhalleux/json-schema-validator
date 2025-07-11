import type {
  CodeContext,
  JSONSchemaDefinition,
  KeywordValidator,
} from "../../../../types";
import * as t from "@babel/types";

export function generateOneOf(
  oneOf: JSONSchemaDefinition[],
  ctx: CodeContext,
): t.Statement[] {
  const blocks: t.Statement[] = [];
  const validCount = t.identifier("validCount");
  blocks.push(
    t.variableDeclaration("let", [
      t.variableDeclarator(validCount, t.numericLiteral(0)),
    ]),
  );

  for (const [index, schema] of oneOf.entries()) {
    if (!schema) continue;
    const code = ctx.compiler.getCodeForSchema(schema, `#/oneOf/${index}`);

    blocks.push(
      t.ifStatement(
        t.binaryExpression("<", validCount, t.numericLiteral(2)),
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
                t.assignmentExpression("+=", validCount, t.numericLiteral(1)),
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

  blocks.push(
    t.ifStatement(
      t.binaryExpression("!==", validCount, t.numericLiteral(1)),
      ctx.fail({}),
    ),
  );

  return blocks;
}

export const OneOfKeyword: KeywordValidator = {
  keyword: "oneOf",
  code(schemaValue, ctx) {
    if (!Array.isArray(schemaValue)) {
      throw new Error("oneOf must be an array");
    }
    return t.blockStatement(generateOneOf(schemaValue, ctx));
  },
};
