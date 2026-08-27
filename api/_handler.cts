import { createApp } from "../server/_core/app";

/**
 * Source entrypoint for the Vercel API bundle. The build script emits an
 * adjacent CommonJS catch-all function so Express dependencies retain Node's
 * runtime `require` support and Vercel does not need source modules outside
 * the `api` directory at runtime.
 */
module.exports = createApp();
