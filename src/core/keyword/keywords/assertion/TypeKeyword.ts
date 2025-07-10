import type { KeywordValidator } from "../../../../types";
import * as t from "@babel/types";

const createTypeCheck = (type: string) => {
  return t.binaryExpression(
    "!==",
    t.unaryExpression("typeof", t.identifier("data")),
    t.stringLiteral(type),
  );
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
