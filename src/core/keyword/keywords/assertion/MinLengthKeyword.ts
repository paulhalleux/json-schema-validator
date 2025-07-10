import type { KeywordValidator } from "../../../../types";
import * as t from "@babel/types";

export const MinLengthKeyword: KeywordValidator = {
  keyword: "minLength",
  code(schemaValue, _, ctx) {
    if (typeof schemaValue !== "number" || schemaValue < 0) {
      throw new Error(
        "Invalid schema value for 'minLength': must be a non-negative number.",
      );
    }

    return t.ifStatement(
      t.binaryExpression(
        "<",
        t.memberExpression(t.identifier("data"), t.identifier("length")),
        t.numericLiteral(schemaValue),
      ),
      ctx.fail({ limit: schemaValue }),
    );
  },
};
