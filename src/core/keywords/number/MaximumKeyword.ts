import * as t from "@babel/types";
import type { KeywordValidator } from "../../Keyword.ts";
import type { CompilationContext } from "../../Compiler.ts";

export const MaximumKeyword: (exclusive: boolean) => KeywordValidator = (
  exclusive,
) => ({
  keyword: exclusive ? "exclusiveMaximum" : "maximum",
  applicableTypes: ["number", "integer"],
  code(schemaValue: unknown, context: CompilationContext) {
    if (typeof schemaValue !== "number") {
      throw new Error(
        `Invalid schema value for 'maximum': ${typeof schemaValue}`,
      );
    }

    return t.ifStatement(
      t.binaryExpression(
        exclusive ? ">=" : ">",
        context.dataIdentifier,
        t.numericLiteral(schemaValue),
      ),
      context.fail({ maximum: schemaValue }),
    );
  },
});
