import type {
  CodeContext,
  JSONSchemaDefinition,
  KeywordValidator,
} from "../../../../types";
import * as t from "@babel/types";

export function generateAllOf(
  allOf: JSONSchemaDefinition[],
  ctx: CodeContext,
): t.Statement[] {
  const blocks: t.Statement[] = [];

  for (const _ of allOf) {
    const index = allOf.indexOf(_);
    const schema = allOf[index];
    if (!schema) {
      continue;
    }
    const code = ctx.compiler.getCodeForSchema(
      schema,
      `#/allOf/${index}`,
      typeof schema === "object" && !("type" in schema),
    );
    blocks.push(
      t.ifStatement(
        t.memberExpression(
          t.identifier("executionContext"),
          t.identifier("valid"),
        ),
        code,
      ),
    );
  }

  return blocks;
}

export const AllOfKeyword: KeywordValidator = {
  keyword: "allOf",
  code(schemaValue, ctx) {
    if (!Array.isArray(schemaValue)) {
      throw new Error("allOf must be an array");
    }

    const statements = generateAllOf(schemaValue, ctx);
    return t.blockStatement(statements);
  },
};
