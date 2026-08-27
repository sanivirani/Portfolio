import { createApp } from "../server/_core/app";

/**
 * Source entrypoint for the Vercel API bundle. The build script emits the
 * adjacent catch-all ESM function so Vercel does not need to resolve source
 * modules outside the `api` directory at runtime.
 */
export default createApp();
