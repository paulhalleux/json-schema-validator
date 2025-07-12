import { type Draft, DraftVersion } from "../Draft.ts";

import {
  MaximumKeyword,
  MinimumKeyword,
  NotKeyword,
  TypeKeyword,
} from "../keywords";

export class Draft_2020_12 implements Draft {
  version = DraftVersion.Draft_2020_12;
  getKeywords() {
    return [TypeKeyword, MinimumKeyword, MaximumKeyword, NotKeyword];
  }
}
