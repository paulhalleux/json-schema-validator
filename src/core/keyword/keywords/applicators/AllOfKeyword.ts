import type {
  CodeContext,
  JSONSchemaDefinition,
  KeywordValidator,
} from "../../../../types";
import * as t from "@babel/types";

export function generateAllOf(
  allOf: JSONSchemaDefinition[],
  schemaPath: string,
): t.Statement[] {
  const blocks: t.Statement[] = [];

  allOf.forEach((_, index) => {
    const varName = `allOf${index}`;
    const compiled = t.callExpression(
      t.memberExpression(t.identifier("compiler"), t.identifier("compile")),
      [
        t.callExpression(
          t.memberExpression(
            t.identifier("executionContext"),
            t.identifier("getSchemaAtPath"),
          ),
          [
            t.stringLiteral(schemaPath + `/allOf/${index}`),
            t.identifier("schema"),
          ],
        ),
        t.stringLiteral(schemaPath + `/allOf/${index}`),
      ],
    );
    const validateCall = t.callExpression(t.identifier(varName), [
      t.identifier("data"),
    ]);

    blocks.push(
      t.variableDeclaration("const", [
        t.variableDeclarator(t.identifier(varName), compiled),
      ]),
      t.variableDeclaration("const", [
        t.variableDeclarator(t.identifier(`${varName}Result`), validateCall),
      ]),
      t.ifStatement(
        t.unaryExpression(
          "!",
          t.memberExpression(
            t.identifier(`${varName}Result`),
            t.identifier("valid"),
          ),
        ),
        t.blockStatement([
          // merge errors
          t.expressionStatement(
            t.callExpression(
              t.memberExpression(
                t.identifier("executionContext"),
                t.identifier("addErrors"),
              ),
              [
                t.memberExpression(
                  t.identifier(`${varName}Result`),
                  t.identifier("errors"),
                ),
              ],
            ),
          ),
        ]),
      ),
    );
  });

  return blocks;
}

export const AllOfKeyword: KeywordValidator = {
  keyword: "allOf",
  code(schemaValue, schemaPath) {
    if (!Array.isArray(schemaValue)) {
      throw new Error("allOf must be an array");
    }

    const statements = generateAllOf(schemaValue, schemaPath);
    return t.blockStatement(statements);
  },
};
