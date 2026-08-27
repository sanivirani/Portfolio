import { OAUTH_STATE_COOKIE, encodeOAuthState } from "@shared/const";

import { contentStudioLoginHrefForOrigin } from "@shared/contentStudioRouting";

export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// The server generates and stores a one-time OAuth nonce before redirecting to
// GitHub. Invoke this only from an event handler or effect, never during render.
export const startLogin = () => {
  window.location.assign(contentStudioLoginHrefForOrigin(window.location.origin));
};
