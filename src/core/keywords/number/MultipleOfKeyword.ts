import * as t from "@babel/types";
import type { KeywordValidator } from "../../Keyword.ts";
import type { CompilationContext } from "../../Compiler.ts";

export const MultipleOfKeyword: KeywordValidator = {
  keyword: "multipleOf",
  applicableTypes: ["number", "integer"],
  code(schemaValue: unknown, context: CompilationContext) {
    if (typeof schemaValue !== "number") {
      throw new Error(`Invalid schema value for 'multipleOf': ${schemaValue}`);
    }

    return t.ifStatement(
      t.binaryExpression(
        "!==",
        t.binaryExpression(
          "%",
          context.dataIdentifier,
          t.numericLiteral(schemaValue),
        ),
        t.numericLiteral(0),
      ),
      context.fail({ multipleOf: schemaValue }),
    );
  },
};
