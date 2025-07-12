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
