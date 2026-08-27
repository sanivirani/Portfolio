# Vercel Runtime Notes

## Deployment observations

- The initial Vercel deployment successfully served the Vite portfolio and `/admin` SPA fallback, but `/api/oauth/callback` returned `404 NOT_FOUND`.
- The first explicit catch-all function deployment (`0d101c7`) emitted an API resource but failed at runtime with `ERR_MODULE_NOT_FOUND` for `server/_core/app`, because the Vercel-generated ESM artifact retained an extensionless source import.
- The second attempt (`5f6318a`) failed to build because Vercel did not recognize `api/[...path].cjs` as a function path in `functions` configuration.
- The current correction emits `api/[...path].js` as a bundled CommonJS function. The `api/package.json` boundary sets `type` to `commonjs`, while the project build regenerates the bundle before Vite produces `dist/public`.

## Official references consulted

- Vercel function configuration permits JavaScript files inside the root `api` directory, supports a `functions` glob with `maxDuration`, and notes that `includeFiles` can add function resources: <https://vercel.com/docs/project-configuration/vercel-json>.
- Vercel's Express guide documents a default exported Express application and warns that static assets are served from deployment output rather than `express.static()`: <https://vercel.com/docs/frameworks/backend/express>.
- MongoDB's Vercel integration documentation confirms that the native integration supplies `MONGODB_URI` and must account for Vercel's dynamic egress IP addresses: <https://www.mongodb.com/docs/atlas/reference/partner-integrations/vercel/>.
