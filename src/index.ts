import { Validator } from "./core/Validator.ts";

const validator = new Validator({});
const validate = await validator.compile({
  type: ["object", "number"],
  minimum: 10,
  maximum: 20,
});

console.log(validate.code);
