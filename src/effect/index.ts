import { Validator } from "./Validator.ts";

const validator = Validator.make({ locale: "en" });

const validate = await validator.compile({
  type: "object",
  properties: {
    name: { type: "string" },
    age: { type: "number", minimum: 0 },
  },
  required: ["name", "age"],
});

console.log(validate.code);
