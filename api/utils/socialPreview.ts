const SOCIAL_PREVIEW_BOT_REGEX =
  /facebookexternalhit|Facebot|meta-externalagent|meta-externalfetcher|Twitterbot|LinkedInBot|Slackbot|Discordbot|TelegramBot|WhatsApp|SkypeUriPreview|Pinterest|Zalo|Googlebot|bingbot|embedly/i;

export const isSocialPreviewBot = (userAgent: string) => {
  if (!userAgent) return false;
  return SOCIAL_PREVIEW_BOT_REGEX.test(userAgent);
};

export { SOCIAL_PREVIEW_BOT_REGEX };
