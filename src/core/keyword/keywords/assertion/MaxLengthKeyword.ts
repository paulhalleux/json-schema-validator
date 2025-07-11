import type { KeywordValidator } from "../../../../types";
import * as t from "@babel/types";

export const MaxLengthKeyword: KeywordValidator = {
  keyword: "maxLength",
  applyTo: ["string"],
  code(schemaValue, ctx) {
    if (typeof schemaValue !== "number" || schemaValue < 0) {
      throw new Error(
        "Invalid schema value for 'maxLength': must be a non-negative number.",
      );
    }

    return t.ifStatement(
      t.binaryExpression(
        ">",
        t.memberExpression(t.identifier("data"), t.identifier("length")),
        t.numericLiteral(schemaValue),
      ),
      ctx.fail({ limit: schemaValue }),
    );
  },
};
