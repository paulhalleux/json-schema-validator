import { Validator } from "./core/Validator.ts";

const validator = new Validator({});
const validate = await validator.compile({
  type: "number",
  multipleOf: 12,
});

// console.log(validate.code);
console.log(validate(24));
