import * as t from "@babel/types";
import type { KeywordValidator } from "../Keyword.ts";
import type { CompilationContext } from "../Compiler.ts";

export const MaximumKeyword: KeywordValidator = {
  keyword: "maximum",
  applicableTypes: ["number", "integer"],
  code(schemaValue: unknown, context: CompilationContext) {
    if (typeof schemaValue !== "number") {
      throw new Error(`Invalid schema value for 'maximum': ${schemaValue}`);
    }

    return t.ifStatement(
      t.binaryExpression(
        ">",
        context.dataIdentifier,
        t.numericLiteral(schemaValue),
      ),
      context.fail({ maximum: schemaValue }),
    );
  },
};
