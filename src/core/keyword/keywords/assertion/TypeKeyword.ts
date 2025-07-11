import type { KeywordValidator } from "../../../../types";
import * as t from "@babel/types";

const createArrayTypeCheck = () => {
  return t.callExpression(
    t.memberExpression(t.identifier("Array"), t.identifier("isArray")),
    [t.identifier("data")],
  );
};

const createTypeofCheck = (type: string) => {
  return t.binaryExpression(
    "!==",
    t.unaryExpression("typeof", t.identifier("data")),
    t.stringLiteral(type),
  );
};

const createChainedLogicalExpression = (
  operator: "&&" | "||",
  expressions: t.Expression[],
) => {
  if (expressions.length === 0) {
    return t.booleanLiteral(true);
  }

  return expressions.slice(1).reduce<t.Expression>((acc, curr) => {
    return t.logicalExpression(operator, acc, curr);
  }, expressions[0]!);
};

const createTypeCheck = (type: string) => {
  if (type === "integer") {
    return t.unaryExpression(
      "!",
      t.callExpression(
        t.memberExpression(t.identifier("Number"), t.identifier("isInteger")),
        [t.identifier("data")],
      ),
    );
  }

  if (type === "null") {
    return t.binaryExpression("!==", t.identifier("data"), t.nullLiteral());
  }

  if (type === "array") {
    return t.unaryExpression("!", createArrayTypeCheck());
  }

  if (type === "object") {
    return createChainedLogicalExpression("||", [
      createTypeofCheck("object"),
      createArrayTypeCheck(),
      t.binaryExpression("===", t.identifier("data"), t.nullLiteral()),
    ]);
  }

  return createTypeofCheck(type);
};

const createOrTypeCheck = (types: string[]) => {
  const typesChecks = types.map(createTypeCheck);
  return typesChecks.slice(1).reduce<t.Expression>((acc, curr) => {
    return t.logicalExpression("&&", acc, curr);
  }, typesChecks[0]!);
};

export const TypeKeyword: KeywordValidator = {
  keyword: "type",
  code(schemaValue, _, ctx) {
    if (Array.isArray(schemaValue)) {
      return t.ifStatement(
        createOrTypeCheck(schemaValue),
        ctx.fail({ type: schemaValue }),
      );
    }

    // If schemaValue is not an array, it should be a single type string
    if (typeof schemaValue !== "string") {
      return [];
    }

    return t.ifStatement(
      createTypeCheck(schemaValue),
      ctx.fail({ type: schemaValue }),
    );
  },
};
