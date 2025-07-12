import * as t from "@babel/types";
import type { ValidationFnFactory } from "../types";
import type { FunctionExpression } from "@babel/types";
import { generate } from "@babel/generator";

/**
 * Creates a variable declaration for the execution context.
 *
 * This function generates this code:
 * ```
 * const executionContext = validator.createExecutionContext(schema);
 * ```
 *
 * @param executionContextIdentifier - The identifier for the execution context variable.
 * @param validatorIdentifier - The identifier for the validator instance.
 * @param schemaIdentifier - The identifier for the schema being validated.
 */
export function createExecutionContextVariable(
  executionContextIdentifier: t.Identifier,
  validatorIdentifier: t.Identifier,
  schemaIdentifier: t.Identifier,
): t.VariableDeclaration {
  return t.variableDeclaration("const", [
    t.variableDeclarator(
      executionContextIdentifier,
      t.callExpression(
        t.memberExpression(
          validatorIdentifier,
          t.identifier("createExecutionContext"),
        ),
        [schemaIdentifier],
      ),
    ),
  ]);
}

/**
 * Creates a return statement that returns the result of the execution context.
 *
 * This function generates this code:
 * ```
 * return executionContext.toResult();
 * ```
 *
 * @param executionContextIdentifier - The identifier for the execution context.
 */
export function createResultReturnStatement(
  executionContextIdentifier: t.Identifier,
): t.ReturnStatement {
  return t.returnStatement(
    t.callExpression(
      t.memberExpression(executionContextIdentifier, t.identifier("toResult")),
      [],
    ),
  );
}

/**
 * Creates a factory function that takes validation function dependencies
 * and returns a validation function.
 *
 * This function generates this code:
 * ```
 * function createValidationFunction(validator, schema) {
 *   const executionContext = validator.createExecutionContext(schema);
 *   return function validate(data) {
 *      ...
 *   }
 * }
 * ```
 *
 */
export function createValidationFunctionFactory(
  factoryIdentifier: t.Identifier,
  executionContextIdentifier: t.Identifier,
  validatorIdentifier: t.Identifier,
  schemaIdentifier: t.Identifier,
  dataIdentifier: t.Identifier,
  validationStatement: t.Statement[],
) {
  return t.functionExpression(
    factoryIdentifier,
    [validatorIdentifier, schemaIdentifier],
    t.blockStatement([
      createExecutionContextVariable(
        executionContextIdentifier,
        validatorIdentifier,
        schemaIdentifier,
      ),
      t.returnStatement(
        t.arrowFunctionExpression(
          [dataIdentifier],
          t.blockStatement([
            ...validationStatement,
            createResultReturnStatement(executionContextIdentifier),
          ]),
        ),
      ),
    ]),
  );
}

/**
 * Creates a factory function from a given factory identifier and a function expression.
 *
 * This function generates a new function that returns the factory function
 * with the provided identifier.
 *
 * @param factoryIdentifier - The identifier for the factory function.
 * @param factoryFunction - The function expression that defines the factory logic.
 * @returns A validation function factory that can be used to create validation functions.
 */
export function createFactoryFunction(
  factoryIdentifier: t.Identifier,
  factoryFunction: FunctionExpression,
): ValidationFnFactory {
  const { code } = generate(factoryFunction);
  return Object.assign(
    new Function(
      `"use strict";\n\n${code};\n\nreturn ${factoryIdentifier.name};`,
    )(),
    { code: code },
  );
}

/**
 * Creates a failure call statement for the execution context.
 *
 * This function generates this code:
 * ```
 * executionContext.report({
 *   keyword: keyword,
 *   params: params,
 *   dataPath: dataPath,
 *   schemaPath: schemaPath,
 *   data: dataIdentifier,
 * });
 * ```
 *
 * @param executionContextIdentifier - The identifier for the execution context.
 * @param dataIdentifier - The identifier for the data being validated.
 * @param keyword - The keyword that caused the validation failure.
 * @param dataPath - The path to the data that caused the validation failure.
 * @param schemaPath - The path to the schema that defines the keyword.
 * @param params - The parameters associated with the validation failure.
 */
export function createFailCall(
  executionContextIdentifier: t.Identifier,
  dataIdentifier: t.Identifier,
  keyword: string,
  dataPath: string,
  schemaPath: string,
  params: Record<string, any>,
) {
  return t.expressionStatement(
    t.callExpression(
      t.memberExpression(executionContextIdentifier, t.identifier("report")),
      [
        t.stringLiteral(keyword),
        t.valueToNode(params),
        t.stringLiteral(dataPath),
        t.stringLiteral(schemaPath),
        dataIdentifier,
      ],
    ),
  );
}

/**
 * Creates a scoped execution statement for the execution context.
 *
 * This function generates this code:
 * ```
 * const scopeResult = executionContext.runScoped(() => {
 *   // callback logic
 * });
 * ```
 *
 * @param scopeResultIdentifier - The identifier for the scoped result variable.
 * @param executionContextIdentifier - The identifier for the execution context.
 * @param callback - The block statement that contains the logic to execute within the scoped context.
 */
export function createScopedExecution(
  scopeResultIdentifier: t.Identifier,
  executionContextIdentifier: t.Identifier,
  callback: t.BlockStatement,
): t.VariableDeclaration {
  return t.variableDeclaration("const", [
    t.variableDeclarator(
      scopeResultIdentifier,
      t.callExpression(
        t.memberExpression(
          executionContextIdentifier,
          t.identifier("runScoped"),
        ),
        [t.arrowFunctionExpression([], callback)],
      ),
    ),
  ]);
}

/**
 * Creates a scoped execution statement with a schema path for the execution context.
 *
 * This function generates this code:
 * ```
 * const scopeResult = executionContext.runScopedWithSchema(schemaPath, () => {
 *   // callback logic
 * });
 * ```
 *
 * @param scopeResultIdentifier - The identifier for the scoped result variable.
 * @param executionContextIdentifier - The identifier for the execution context.
 * @param schemaPathIdentifier - The identifier for the schema path.
 * @param callback - The block statement that contains the logic to execute within the scoped context.
 */
export function createScopedExecutionSubSchema(
  scopeResultIdentifier: t.Identifier,
  executionContextIdentifier: t.Identifier,
  schemaPathIdentifier: t.Identifier,
  callback: t.BlockStatement,
): t.VariableDeclaration {
  return t.variableDeclaration("const", [
    t.variableDeclarator(
      scopeResultIdentifier,
      t.callExpression(
        t.memberExpression(
          executionContextIdentifier,
          t.identifier("runScopedSubSchema"),
        ),
        [schemaPathIdentifier, t.arrowFunctionExpression([], callback)],
      ),
    ),
  ]);
}

/**
 * Creates a chained logical expression from an array of expressions.
 *
 * This function generates a logical expression that combines multiple expressions
 * using the specified operator (&&, ||, ??).
 *
 * @param operator - The logical operator to use for combining the expressions.
 * @param expressions - An array of expressions to combine.
 * @returns A single logical expression that combines all provided expressions.
 */
export function createChainedLogicalExpression(
  operator: "&&" | "||" | "??",
  expressions: t.Expression[],
): t.Expression {
  if (expressions.length === 0) {
    throw new Error(
      "At least one expression is required for a logical expression.",
    );
  }

  const first = expressions[0];
  if (expressions.length === 1 && first) {
    return first;
  }

  return expressions.slice(1).reduce((acc, expr) => {
    return t.logicalExpression(operator, acc, expr);
  }, first!);
}

/**
 * Chains multiple if statements into a single if statement.
 *
 * This function takes an array of if statements and chains them together,
 * where the consequent of each if statement becomes the test of the next one.
 *
 * @param ifStatements - An array of if statements to chain.
 * @returns A single if statement that represents the chained conditions.
 */
export function chainIfStatements(
  ifStatements: t.IfStatement[],
): t.IfStatement {
  if (ifStatements.length < 1) {
    throw new Error("At least one if statement is required.");
  }

  const firstIf = ifStatements[0]!;
  return ifStatements
    .slice(1)
    .reduce<t.IfStatement>((acc, currentIf, index, self) => {
      return t.ifStatement(
        acc.test,
        t.blockStatement([acc.consequent]),
        index === self.length - 1
          ? t.ifStatement(
              currentIf.test,
              t.blockStatement([currentIf.consequent]),
            )
          : currentIf,
      );
    }, firstIf);
}
