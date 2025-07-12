import { Validator } from "./core/Validator.ts";

const validator = new Validator({});
const schema = {
  allOf: [{ type: "number" }, { minimum: 10 }],
};
console.time("Compilation Time");
const validate = await validator.compile(schema);
console.timeEnd("Compilation Time");

console.time("Validation Time");
const res = validate(8);
console.timeEnd("Validation Time");
console.log("Validation Result:", res.valid);
