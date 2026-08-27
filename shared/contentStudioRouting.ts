export const CONTENT_STUDIO_PRODUCTION_ORIGIN = "https://portfolio-henna-nu-35.vercel.app";

const isManusPreviewHost = (hostname: string) =>
  hostname.endsWith(".manus.space") || hostname.endsWith(".manus.computer");

function pathname(path: string) {
  return path.startsWith("/") ? path : `/${path}`;
}

/**
 * Content Studio sessions are issued by the Vercel Production function. The
 * Manus preview stays useful for reviewing the public site, but it cannot
 * complete the production GitHub OAuth flow because its runtime has no OAuth
 * client credentials. Send only Manus-hosted admin entry points to Production.
 */
export function contentStudioHrefForOrigin(origin: string, path = "/admin") {
  const targetPath = pathname(path);
  try {
    const hostname = new URL(origin).hostname;
    return isManusPreviewHost(hostname)
      ? `${CONTENT_STUDIO_PRODUCTION_ORIGIN}${targetPath}`
      : targetPath;
  } catch {
    return targetPath;
  }
}

export function contentStudioLoginHrefForOrigin(origin: string) {
  return contentStudioHrefForOrigin(origin, "/api/oauth/github");
}
