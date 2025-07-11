import type { KeywordValidator } from "../../../../types";
import * as t from "@babel/types";

export const MaximumKeyword: KeywordValidator = {
  keyword: "maximum",
  applyTo: ["number", "integer"],
  code(schemaValue, ctx) {
    if (typeof schemaValue !== "number") {
      throw new Error("Invalid schema value for 'maximum': must be a number.");
    }

    return t.ifStatement(
      t.binaryExpression(
        ">",
        t.identifier("data"),
        t.numericLiteral(schemaValue),
      ),
      ctx.fail({ limit: schemaValue }),
    );
  },
};
