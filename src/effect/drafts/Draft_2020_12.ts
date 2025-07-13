import { DraftVersion, DraftRegistry } from "../services/DraftRegistry";

export class Draft_2020_12 implements DraftRegistry.Draft {
  version = DraftVersion.Draft_2020_12;
  getKeywords() {
    return [];
  }
}
