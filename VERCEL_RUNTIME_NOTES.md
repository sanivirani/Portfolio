# Vercel Runtime Notes

## Deployment observations

- The initial Vercel deployment successfully served the Vite portfolio and `/admin` SPA fallback, but `/api/oauth/callback` returned `404 NOT_FOUND`.
- The first explicit catch-all function deployment (`0d101c7`) emitted an API resource but failed at runtime with `ERR_MODULE_NOT_FOUND` for `server/_core/app`, because the Vercel-generated ESM artifact retained an extensionless source import.
- The second attempt (`5f6318a`) failed to build because Vercel did not recognize `api/[...path].cjs` as a function path in `functions` configuration.
- The current correction emits `api/[...path].js` as a bundled CommonJS function. The `api/package.json` boundary sets `type` to `commonjs`, while the project build regenerates the bundle before Vite produces `dist/public`.
- MongoDB Atlas was connected through the Portfolio project’s Vercel integration. Vercel lists a masked `MONGODB_URI` environment variable for both Production and Preview.
- Redeployment `FPp9MAnHZqW1vYkrJhnGLoyBcuFy` completed successfully. A direct production request to `portfolio.public.site` returned the portfolio payload, confirming that the Vercel function can read through the Atlas-backed persistence path.
- The GitHub OAuth deployment initially reached GitHub consent but then failed in the callback because MongoDB rejected the user upsert: the same profile properties, including `name`, were present in both `$set` and `$setOnInsert`.
- Commit `861ed351` resolves that conflict by constructing mutually exclusive `$set` and `$setOnInsert` field sets, with a regression test that asserts no duplicate update paths. The deployed `/api/oauth/github` endpoint redirects with only `read:user`, its parameterless callback still returns HTTP `400`, and an approved `sanivirani` sign-in now returns to Content Studio successfully.
- The authenticated owner workflow was verified in Production: an authorized Content Studio content change persisted through MongoDB, the original content was restored, and logout returned `/admin` to its sign-in gate. GitHub OAuth variables are intentionally Production-only; Preview login remains unconfigured until a stable Preview callback domain is selected.

## Official references consulted

- Vercel function configuration permits JavaScript files inside the root `api` directory, supports a `functions` glob with `maxDuration`, and notes that `includeFiles` can add function resources: <https://vercel.com/docs/project-configuration/vercel-json>.
- Vercel's Express guide documents a default exported Express application and warns that static assets are served from deployment output rather than `express.static()`: <https://vercel.com/docs/frameworks/backend/express>.
- MongoDB's Vercel integration documentation confirms that the native integration supplies `MONGODB_URI` and must account for Vercel's dynamic egress IP addresses: <https://www.mongodb.com/docs/atlas/reference/partner-integrations/vercel/>.
