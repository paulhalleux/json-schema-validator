import type { CodeContext, KeywordValidator } from "../../../../types";
import * as t from "@babel/types";
import {
  createChainedLogicalExpression,
  createTypeofCheck,
} from "../../../../utils/codegen.ts";

const createArrayTypeCheck = () => {
  return t.callExpression(
    t.memberExpression(t.identifier("Array"), t.identifier("isArray")),
    [t.identifier("data")],
  );
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
      createTypeofCheck("data", "!==", "object"),
      createArrayTypeCheck(),
      t.binaryExpression("===", t.identifier("data"), t.nullLiteral()),
    ]);
  }

  return createTypeofCheck("data", "!==", type);
};

const createAlternativeTypeCheck = (
  type: string,
  ctx: CodeContext,
): t.Statement[] => {
  // if the type is correct, we need to validate keywords that apply to it
  const validKeywords = ctx.validator.keywordRegistry.getByType(type);
  const statements: t.Statement[] = [];

  for (const keyword of validKeywords) {
    if (!keyword.code || !(keyword.keyword in ctx.schema)) {
      continue;
    }

    const result = keyword.code(ctx.schema[keyword.keyword], ctx);
    if (Array.isArray(result)) {
      statements.push(...result);
    } else {
      statements.push(result);
    }
  }

  return statements;
};

export const TypeKeyword: KeywordValidator = {
  keyword: "type",
  code(schemaValue, ctx) {
    if (Array.isArray(schemaValue)) {
      const typesChecks = schemaValue.map(createTypeCheck);
      return t.ifStatement(
        createChainedLogicalExpression("&&", typesChecks),
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
      t.blockStatement(createAlternativeTypeCheck(schemaValue, ctx)),
    );
  },
};
