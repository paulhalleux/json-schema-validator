# json-schema-validator

A personal project to validate JSON data against a JSON schema.
It allows compiling a JSON schema into a validator and then using that validator to validate JSON data.

The idea is to generate a validation function that validates the minimum things possible to be as performant as
possible.

In the following example, we only validate against the keywords present in the schema,
and we only validate type specific keywords if the type matches the data.

## Example

```json
{
  "type": "string",
  "minLength": 3,
  "maxLength": 5
}
```

```js
const validate = data => {
  const executionContext = validator.createExecutionContext(schema);
  const validationContext = {
    dataPath: "",
    schemaPath: "#",
    rootSchema: schema,
    validator: validator,
    refStack: executionContext.refStack
  };
  if (typeof data !== "string") {
    executionContext.addError("type", {
      type: "string"
    }, validationContext);
  } else {
    if (data.length < 3) {
      executionContext.addError("minLenght", {
        limit: 3
      }, validationContext);
    } else if (data.length > 5) {
      executionContext.addError("maxLenght", {
        limit: 5
      }, validationContext);
    }
  }
  return executionContext.toValidationResult();
};
```

### More complex example

```json
{
  "oneOf": [
    {
      "type": "string"
    },
    {
      "type": "number"
    },
    {
      "minLength": 3
    }
  ]
}
```

```js
const validate = data => {
    const executionContext = validator.createExecutionContext(schema);
    const validationContext = {
      dataPath: "",
      schemaPath: "#",
      rootSchema: schema,
      validator: validator,
      refStack: executionContext.refStack
    };
    {
      let validCount = 0;
      if (validCount < 2) {
        executionContext.createScope();
        const validationContext = {
          dataPath: "",
          schemaPath: "#/oneOf/0",
          rootSchema: schema,
          validator: validator,
          refStack: executionContext.refStack
        };
        if (typeof data !== "string") {
          executionContext.addError("type", {
            type: "string"
          }, validationContext);
        }
        if (executionContext.valid) {
          validCount += 1;
        }
        executionContext.closeScope();
      }
      if (validCount < 2) {
        executionContext.createScope();
        const validationContext = {
          dataPath: "",
          schemaPath: "#/oneOf/1",
          rootSchema: schema,
          validator: validator,
          refStack: executionContext.refStack
        };
        if (typeof data !== "number") {
          executionContext.addError("type", {
            type: "number"
          }, validationContext);
        }
        if (executionContext.valid) {
          validCount += 1;
        }
        executionContext.closeScope();
      }
      if (validCount < 2) {
        executionContext.createScope();
        const validationContext = {
          dataPath: "",
          schemaPath: "#/oneOf/2",
          rootSchema: schema,
          validator: validator,
          refStack: executionContext.refStack
        };
        if (executionContext.valid) {
          validCount += 1;
        }
        executionContext.closeScope();
      }
      if (validCount !== 1) {
        executionContext.addError("oneOf", {}, validationContext);
      }
    }
    return executionContext.toValidationResult();
  }
```