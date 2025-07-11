import type { CodeContext, KeywordValidator } from "../../../../types";
import * as t from "@babel/types";
import {
  createChainedLogicalExpression,
  createTypeofCheck,
} from "../../../../utils/codegen.ts";
import { createFailFunction } from "../../../../utils/compile.ts";
import type { Statement } from "@babel/types";

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
): t.IfStatement | undefined => {
  // if the type is correct, we need to validate keywords that apply to it
  const validKeywords = ctx.validator.keywordRegistry
    .getByType(type)
    .filter((keyword) => {
      return keyword.code && keyword.keyword in ctx.schema;
    });

  const firstKeyword = validKeywords[0]!;
  if (!firstKeyword || !firstKeyword.code) {
    return undefined;
  }

  return validKeywords.slice(1).reduce<t.IfStatement>(
    (previousValue, currentValue) => {
      if (t.isIfStatement(previousValue) && currentValue.code) {
        return t.ifStatement(
          previousValue.test,
          previousValue.consequent,
          currentValue.code(ctx.schema[currentValue.keyword], {
            ...ctx,
            fail(params: Record<string, any>): Statement {
              return createFailFunction(
                currentValue.keyword,
                ctx.schema[currentValue.keyword],
                params,
              );
            },
          }),
        );
      }
      return previousValue;
    },
    firstKeyword.code(ctx.schema[firstKeyword.keyword], {
      ...ctx,
      fail(params: Record<string, any>): Statement {
        return createFailFunction(
          firstKeyword.keyword,
          ctx.schema[firstKeyword.keyword],
          params,
        );
      },
    }) as t.IfStatement,
  );
};

export const TypeKeyword: KeywordValidator = {
  keyword: "type",
  code(schemaValue, ctx) {
    if (Array.isArray(schemaValue)) {
      const typesChecks = schemaValue.map(createTypeCheck);

      const firstType = schemaValue[0];
      const firstAlt = firstType && createAlternativeTypeCheck(firstType, ctx);
      const firstAltCheck =
        firstAlt &&
        t.ifStatement(createTypeCheck(firstType), t.blockStatement([firstAlt]));

      const alts = firstAltCheck
        ? schemaValue
            .slice(1)
            .reduce<t.IfStatement>((previousValue, currentValue) => {
              const alt = createAlternativeTypeCheck(currentValue, ctx);
              if (!alt) {
                return previousValue;
              }

              return t.ifStatement(
                createTypeCheck(currentValue),
                alt,
                previousValue,
              );
            }, firstAltCheck)
        : undefined;

      return t.ifStatement(
        createChainedLogicalExpression("&&", typesChecks),
        ctx.fail({ type: schemaValue }),
        alts ? t.blockStatement([alts]) : undefined,
      );
    }

    // If schemaValue is not an array, it should be a single type string
    if (typeof schemaValue !== "string") {
      throw new Error(
        `Invalid type for 'type' keyword: expected string or array, got ${typeof schemaValue}`,
      );
    }

    const alt = createAlternativeTypeCheck(schemaValue, ctx);
    return t.ifStatement(
      createTypeCheck(schemaValue),
      ctx.fail({ type: schemaValue }),
      alt ? t.blockStatement([alt]) : undefined,
    );
  },
};
