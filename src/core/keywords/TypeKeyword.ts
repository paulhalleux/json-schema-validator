import * as t from "@babel/types";
import type { KeywordValidator } from "../Keyword.ts";
import type { CompilationContext } from "../Compiler.ts";
import {
  chainIfStatements,
  createChainedLogicalExpression,
} from "../../utils/babel.ts";

/**
 * Creates a typeof check for the given type.
 * This function generates this code:
 * ```js
 * typeof data === "type"
 * typeof data !== "type"
 * ```
 *
 * @param type - The type to check against.
 * @param context - The compilation context containing the data identifier.
 * @param negate - If true, negates the check (e.g., checks if data is not of the specified type).
 */
const createTypeofCheck = (
  type: string,
  context: CompilationContext,
  negate: boolean,
): t.Expression => {
  return t.binaryExpression(
    negate ? "!==" : "===",
    t.unaryExpression("typeof", context.dataIdentifier),
    t.stringLiteral(type),
  );
};

/**
 * Creates an isArray check for the given context.
 * This function generates this code:
 * ```js
 * Array.isArray(data)
 * ```
 *
 * @param context - The compilation context containing the data identifier.
 * @param negate - If true, negates the check (e.g., checks if data is not an array).
 */
const createIsArrayCheck = (
  context: CompilationContext,
  negate: boolean,
): t.Expression => {
  const isArray = t.callExpression(
    t.memberExpression(t.identifier("Array"), t.identifier("isArray")),
    [context.dataIdentifier],
  );

  return negate ? t.unaryExpression("!", isArray) : isArray;
};

/**
 * Creates a type check for the given type.
 * Depending on the type, it generates different checks:
 * - For "null", it checks if the data is strictly equal to `null`.
 * - For "array", it checks if the data is an instance of `Array`.
 * - For "object", it checks if the data is an instance of `Object` and not `null` and not an `Array`.
 * - For other types, it generates a `typeof` check.
 *
 * @param type - The type to check against (e.g., "null", "array", "object", or any other type).
 * @param context - The compilation context containing the data identifier.
 * @param negate - If true, negates the check (e.g., checks if data is not of the specified type).
 */
const createTypeCheck = (
  type: string,
  context: CompilationContext,
  negate: boolean,
): t.Expression => {
  switch (type) {
    case "null":
      return t.binaryExpression(
        negate ? "!==" : "===",
        context.dataIdentifier,
        t.nullLiteral(),
      );
    case "array":
      return createIsArrayCheck(context, negate);
    case "object":
      return createChainedLogicalExpression(negate ? "||" : "&&", [
        createTypeofCheck("object", context, negate),
        t.binaryExpression(
          negate ? "===" : "!==",
          context.dataIdentifier,
          t.nullLiteral(),
        ),
        createIsArrayCheck(context, !negate),
      ]);
    default:
      return createTypeofCheck(type, context, negate);
  }
};

const createTypeSubSchema = async (
  type: string,
  context: CompilationContext,
) => {
  const statements = await context.compiler.createSchemaStatements(
    context.rootSchema,
    context.options,
    context.schemaPath,
    context.dataPath,
    type,
  );

  const [ifStatements, otherStatements] = statements.reduce(
    (acc, statement) => {
      if (t.isIfStatement(statement)) {
        acc[0].push(statement);
      } else {
        acc[1].push(statement);
      }
      return acc;
    },
    [[], []] as [t.Statement[], t.Statement[]],
  );

  if (
    ifStatements.length < 2 ||
    !ifStatements.every((s) => t.isIfStatement(s))
  ) {
    return statements;
  }

  return [chainIfStatements(ifStatements), ...otherStatements];
};

const createArrayItemTypeCheck = async (
  typeCheck: t.Expression,
  type: string,
  context: CompilationContext,
  prev: t.Statement | undefined,
) => {
  return t.ifStatement(
    typeCheck,
    t.blockStatement(await createTypeSubSchema(type, context)),
    prev,
  );
};

export const TypeKeyword: KeywordValidator = {
  keyword: "type",
  async code(schemaValue: unknown, context: CompilationContext) {
    if (
      typeof schemaValue !== "string" &&
      (!Array.isArray(schemaValue) || schemaValue.length === 0)
    ) {
      throw new Error(
        `Invalid schema value for 'type' keyword: ${typeof schemaValue}, must be a string or a non-empty array.`,
      );
    }

    if (Array.isArray(schemaValue)) {
      const typeChecks = schemaValue.map((type) => {
        if (typeof type !== "string") {
          throw new Error(
            `Invalid type in 'type' array: ${typeof type}, must be a string.`,
          );
        }
        return createTypeCheck(type, context, false);
      });

      const first = typeChecks[0];
      if (!first) {
        throw new Error("Type array cannot be empty."); // should not happen
      }

      return await typeChecks.slice(1).reduce(
        async (acc, typeCheck, index) => {
          return createArrayItemTypeCheck(
            typeCheck,
            schemaValue[index + 1],
            context,
            await acc,
          );
        },
        createArrayItemTypeCheck(
          first,
          schemaValue[0],
          context,
          t.blockStatement([context.fail({ type: schemaValue })]),
        ),
      );
    }

    return t.ifStatement(
      createTypeCheck(schemaValue, context, true),
      t.blockStatement([context.fail({ type: schemaValue })]),
      t.blockStatement(await createTypeSubSchema(schemaValue, context)),
    );
  },
};
