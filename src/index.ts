import { Validator } from "./core/Validator.ts";

const validator = new Validator({});
const validate = validator.compileSync({
  oneOf: [{ type: "string" }, { type: "number" }, { minLength: 3 }],
});

console.log(validate.code);
