import * as t from "@babel/types";

export function createFailFunction(
  keyword: string,
  value: any,
  params: Record<string, any>,
  dataPath: string,
  schemaPath: string,
): t.Statement {
  return t.blockStatement([
    t.expressionStatement(
      t.callExpression(
        t.memberExpression(
          t.identifier("executionContext"),
          t.identifier("addError"),
        ),
        [
          t.stringLiteral(keyword),
          t.valueToNode(params),
          t.objectExpression([
            t.objectProperty(
              t.identifier("dataPath"),
              t.stringLiteral(dataPath),
            ),
            t.objectProperty(
              t.identifier("schemaPath"),
              t.stringLiteral(schemaPath),
            ),
            t.objectProperty(
              t.identifier("rootSchema"),
              t.identifier("schema"),
            ),
            t.objectProperty(
              t.identifier("validator"),
              t.identifier("validator"),
            ),
            t.objectProperty(
              t.identifier("refStack"),
              t.memberExpression(
                t.identifier("executionContext"),
                t.identifier("refStack"),
              ),
            ),
          ]),
        ],
      ),
    ),
  ]);
}

export function createExecutionContextDeclaration() {
  return t.variableDeclaration("const", [
    t.variableDeclarator(
      t.identifier("executionContext"),
      t.callExpression(
        t.memberExpression(
          t.identifier("validator"),
          t.identifier("createExecutionContext"),
        ),
        [t.identifier("schema")],
      ),
    ),
  ]);
}

export function createValidationReturn() {
  return t.returnStatement(
    t.callExpression(
      t.memberExpression(
        t.identifier("executionContext"),
        t.identifier("toValidationResult"),
      ),
      [],
    ),
  );
}
