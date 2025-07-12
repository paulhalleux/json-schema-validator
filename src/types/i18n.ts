export type MessageFactory = (
  params: Record<string, any> & { keyword: string },
) => string;

export type I18nMessages = Record<string, MessageFactory> & {
  default: MessageFactory;
};
