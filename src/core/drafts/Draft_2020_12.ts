import { type Draft, DraftVersion } from "../Draft.ts";

import {
  AllOfKeyword,
  MaximumKeyword,
  MinimumKeyword,
  MultipleOfKeyword,
  NotKeyword,
  TypeKeyword,
} from "../keywords";

export class Draft_2020_12 implements Draft {
  version = DraftVersion.Draft_2020_12;
  getKeywords() {
    return [
      // Global Keywords
      TypeKeyword,

      // Applicators Keywords
      NotKeyword,
      AllOfKeyword,

      // Number Keywords
      MinimumKeyword(true), // exclusiveMinimum
      MinimumKeyword(false),
      MaximumKeyword(true), // exclusiveMaximum
      MaximumKeyword(false),
      MultipleOfKeyword,
    ];
  }
}
