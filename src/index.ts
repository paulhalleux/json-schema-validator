import { Validator } from "./core/Validator.ts";

const validator = new Validator({});
const validate = await validator.compile({
  type: "boolean",
});

// console.log(validate.code);
console.log(validate("true"));
