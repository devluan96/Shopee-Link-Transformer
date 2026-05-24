const SOCIAL_PREVIEW_BOT_REGEX =
  /facebookexternalhit|Facebot|meta-externalagent|meta-externalfetcher|Twitterbot|LinkedInBot|Slackbot|Discordbot|TelegramBot|WhatsApp|SkypeUriPreview|Pinterest|Googlebot|bingbot|embedly/i;
const META_PREVIEW_BOT_REGEX =
  /facebookexternalhit|Facebot|meta-externalagent|meta-externalfetcher/i;

export const isSocialPreviewBot = (userAgent: string) => {
  if (!userAgent) return false;
  return SOCIAL_PREVIEW_BOT_REGEX.test(userAgent);
};

export const isMetaPreviewBot = (userAgent: string) => {
  if (!userAgent) return false;
  return META_PREVIEW_BOT_REGEX.test(userAgent);
};

export { SOCIAL_PREVIEW_BOT_REGEX, META_PREVIEW_BOT_REGEX };
