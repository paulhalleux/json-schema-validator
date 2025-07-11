import * as t from "@babel/types";

export const createChainedLogicalExpression = (
  operator: "&&" | "||" | "??",
  expressions: t.Expression[],
) => {
  if (expressions.length === 0) {
    return t.booleanLiteral(true);
  }

  return expressions.slice(1).reduce<t.Expression>((acc, curr) => {
    return t.logicalExpression(operator, acc, curr);
  }, expressions[0]!);
};

export const createTypeofCheck = (
  identifier: string,
  operator: "===" | "!==",
  type: string,
) => {
  return t.binaryExpression(
    operator,
    t.unaryExpression("typeof", t.identifier(identifier)),
    t.stringLiteral(type),
  );
};
