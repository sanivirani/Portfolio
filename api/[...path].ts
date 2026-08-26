import { createApp } from "../server/_core/app";

/**
 * Vercel discovers this catch-all function at /api/*.
 * The application continues to use same-origin endpoints such as
 * /api/trpc and /api/oauth/callback without client-side URL changes.
 */
export default createApp();
