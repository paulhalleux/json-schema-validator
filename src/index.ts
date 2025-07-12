import { Validator } from "./core/Validator.ts";

const validator = new Validator({});
const validate = validator.compile({
  oneOf: [{ type: "string" }, { type: "number" }, { minLength: 3 }],
});

await Bun.write("./test.js", validate.code);
