import { describe, test, expect } from "bun:test";
import * as t from "@babel/types";
import { generate } from "@babel/generator";
import {
  createExecutionContextVariable,
  createResultReturnStatement,
  createValidationFunctionFactory,
} from "../../src/utils/babel";

describe("utils/babel", () => {
  test("createExecutionContextVariable", () => {
    const executionContextIdentifier = t.identifier("executionContext");
    const validatorIdentifier = t.identifier("validator");
    const schemaIdentifier = t.identifier("schema");

    const result = createExecutionContextVariable(
      executionContextIdentifier,
      validatorIdentifier,
      schemaIdentifier,
    );

    const { code } = generate(result);

    expect(code).toContain(
      `
const executionContext = validator.createExecutionContext(schema);
      `.trim(),
    );
  });

  test("createResultReturnStatement", () => {
    const executionContextIdentifier = t.identifier("executionContext");

    const result = createResultReturnStatement(executionContextIdentifier);

    const { code } = generate(result);

    expect(code).toContain(
      `
return executionContext.toResult();
      `.trim(),
    );
  });

  test("createValidationFunctionFactory", () => {
    const factoryIdentifier = t.identifier("createValidationFunction");
    const validatorIdentifier = t.identifier("validator");
    const schemaIdentifier = t.identifier("schema");
    const dataIdentifier = t.identifier("data");

    const validationStatement = [
      t.expressionStatement(
        t.callExpression(
          t.memberExpression(t.identifier("console"), t.identifier("log")),
          [t.stringLiteral("Validation logic goes here")],
        ),
      ),
    ];

    const result = createValidationFunctionFactory(
      factoryIdentifier,
      validatorIdentifier,
      schemaIdentifier,
      dataIdentifier,
      validationStatement,
    );

    const { code } = generate(result);

    expect(code).toContain(
      `
function createValidationFunction(validator, schema) {
  const executionContext = validator.createExecutionContext(schema);
  return data => {
    console.log("Validation logic goes here");
    return executionContext.toResult();
  };
}
      `.trim(),
    );
  });
});
