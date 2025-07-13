import { Validator } from "./Validator.ts";
import { DraftVersion } from "./services/DraftRegistry.ts";

console.time("Create Validator");
const validator = Validator.make({
  locale: "en",
  draft: DraftVersion.Draft_2020_12,
});
console.timeEnd("Create Validator");

console.time("Compile Schema");
const validate = validator.compileSync({
  type: "object",
  properties: {
    name: { type: "string" },
    age: { type: "number", minimum: 0 },
  },
  required: ["name", "age"],
});
console.timeEnd("Compile Schema");

console.log(validate.code);
