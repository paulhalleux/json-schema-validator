import * as t from "@babel/types";
import type { KeywordValidator } from "../../Keyword.ts";
import type { CompilationContext } from "../../Compiler.ts";

export const MinimumKeyword: (exclusive: boolean) => KeywordValidator = (
  exclusive,
) => ({
  keyword: exclusive ? "exclusiveMinimum" : "minimum",
  applicableTypes: ["number", "integer"],
  code(schemaValue: unknown, context: CompilationContext) {
    if (typeof schemaValue !== "number") {
      throw new Error(
        `Invalid schema value for 'minimum': ${typeof schemaValue}`,
      );
    }

    return t.ifStatement(
      t.binaryExpression(
        exclusive ? "<=" : "<",
        context.dataIdentifier,
        t.numericLiteral(schemaValue),
      ),
      context.fail({ minimum: schemaValue }),
    );
  },
});
