const VIDEO_EXTENSION_REGEX = /\.(mp4|mov|webm|m4v)$/i;

export const buildPublicVideoUrl = (rawUrl?: string | null) => {
  const trimmedUrl = rawUrl?.trim() || "";
  if (!trimmedUrl) return "";

  const imageKitEndpoint = process.env.IMAGEKIT_URL_ENDPOINT?.trim() || "";
  if (!imageKitEndpoint) return trimmedUrl;

  try {
    const endpointUrl = new URL(imageKitEndpoint);
    const uploadedUrl = new URL(trimmedUrl);
    const normalizedEndpoint =
      endpointUrl.origin + endpointUrl.pathname.replace(/\/+$/, "");

    if (!trimmedUrl.startsWith(normalizedEndpoint)) {
      return trimmedUrl;
    }

    const transformedPathPrefix =
      endpointUrl.pathname.replace(/\/+$/, "") + "/tr:";
    if (uploadedUrl.pathname.startsWith(transformedPathPrefix)) {
      return trimmedUrl;
    }

    let assetPath = uploadedUrl.pathname.slice(
      endpointUrl.pathname.replace(/\/+$/, "").length,
    );
    if (!assetPath.startsWith("/")) {
      assetPath = `/${assetPath}`;
    }

    const hintedPath = VIDEO_EXTENSION_REGEX.test(assetPath)
      ? assetPath
      : `${assetPath.replace(/\/+$/, "")}/ik-video.mp4`;

    return `${normalizedEndpoint}/tr:q-auto${hintedPath}${uploadedUrl.search}`;
  } catch {
    return trimmedUrl;
  }
};
