import { type Draft, DraftVersion } from "./Draft.ts";
import type { Validator } from "../Validator.ts";
import type { KeywordValidator } from "../../types";
import {
  OneOfKeyword,
  AllOfKeyword,
  AnyOfKeyword,
  MinLengthKeyword,
  MaxLengthKeyword,
  TypeKeyword,
} from "../keyword";

export class Draft202012 implements Draft {
  version = DraftVersion.Draft_2020_12;

  constructor(private readonly validator: Validator) {}

  getKeywords(): KeywordValidator[] {
    return [
      TypeKeyword,
      MinLengthKeyword,
      MaxLengthKeyword,
      AllOfKeyword,
      OneOfKeyword,
      AnyOfKeyword,
    ];
  }
}
