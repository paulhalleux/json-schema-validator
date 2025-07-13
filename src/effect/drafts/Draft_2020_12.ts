import { DraftRegistry } from "../services/DraftRegistry";

export class Draft_2020_12 implements DraftRegistry.Draft {
  version = DraftRegistry.DraftVersion.Draft_2020_12;
  getKeywords() {
    return [];
  }
}
