import { Context, Effect, Layer } from "effect";
import { type Locale, locales } from "../i18n";

export class Translator extends Context.Tag("Translator")<
  Translator,
  Translator.Proto
>() {
  static make = ({ locale, getErrorMessage }: Translator.Options) => {
    return Layer.effect(
      Translator,
      Effect.gen(function* () {
        return {
          translate: (keyword, params, schemaValue) => {
            const translatedMessage = getErrorMessage?.(
              keyword,
              params,
              schemaValue,
            );

            if (translatedMessage !== undefined) {
              return Effect.succeed(translatedMessage);
            }

            const messages = locales[locale];
            const messageFactory = messages[keyword] || messages.default;
            return Effect.succeed(messageFactory({ ...params, keyword }));
          },
        };
      }),
    );
  };
}

export declare namespace Translator {
  interface Proto {
    translate: (
      keyword: string,
      params: Params,
      schemaValue: unknown,
    ) => Effect.Effect<string>;
  }

  interface Options {
    locale: Locale;
    getErrorMessage?: (
      keyword: string,
      params: Params,
      schemaValue?: unknown,
    ) => string | undefined;
  }

  type Params = Record<string, string | number | boolean | null | undefined>;
}
