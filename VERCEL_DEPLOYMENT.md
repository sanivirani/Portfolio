# Vercel Deployment Guide

This repository now has a Vercel-ready build configuration. It separates the Vite client build from the Express application and emits a self-contained CommonJS serverless entrypoint at `api/[...path].js` for the existing same-origin API endpoints. The `api/package.json` CommonJS boundary preserves Express dependency loading while keeping the artifact visible to Vercel as a standard JavaScript function. The configured fallback excludes `/api/*` so API requests reach the Vercel Function, while client-side routes such as `/admin` resolve to the Vite application after a refresh.

> **Important:** The current Manus deployment remains the recommended live environment until the external database, OAuth callback, and media migration steps below are complete. The project currently uses Manus services for its published media and OAuth integration.

## 1. Import the repository

Export the project to GitHub from Manus, then import the repository in the [Vercel dashboard](https://vercel.com/new). Vercel will use the repository's `vercel.json`, run `pnpm build:client`, publish `dist/public`, and expose the Express application from the generated catch-all `/api/*` function. The build regenerates this self-contained CommonJS function so Express dependencies retain Node's native module loading and runtime code does not depend on extensionless imports outside `api/`. Vercel supports default-exported Express applications as Functions, while static files must be served from the deployment output rather than `express.static()`.[1]

The first Vercel deployment becomes Production; later pushes to the production branch deploy to Production, while other branches create Preview deployments.[2]

## 2. Add environment variables

In **Vercel Project Settings → Environment Variables**, add the values below to **Production** and **Preview**. Do not commit `.env`, `.env.local`, or real secret values. Vercel applies variable changes only to newly created deployments, so redeploy after changing a value.[3]

The repository intentionally does not include a committed `.env.example`, because its deployment tooling blocks environment files. Use the table below as the canonical template when creating variables in Vercel.

| Variable | Required | Where it is used | Vercel value guidance |
|---|---:|---|---|
| `MONGODB_URI` | Yes | Cached MongoDB Atlas client and Content Studio collections | Use the Atlas `mongodb+srv://…` connection URI. Add it as a secret, never in the browser bundle. |
| `MONGODB_DB` | No | MongoDB database selection | Defaults to the database in `MONGODB_URI`, or `sani_portfolio` when no database name is present. |
| `JWT_SECRET` | Yes | Session signing and verification | Generate a long random secret; use the same value for all Production instances. |
| `VITE_APP_ID` | Yes | Browser OAuth login start | OAuth application identifier. This value is visible in the client bundle. |
| `VITE_OAUTH_PORTAL_URL` | Yes | Browser OAuth login start | OAuth portal base URL, without a trailing callback path. This value is visible in the client bundle. |
| `OAUTH_SERVER_URL` | Yes | Server OAuth code exchange and profile lookup | OAuth provider API base URL. |
| `OWNER_OPEN_ID` | Yes | Owner/admin role assignment | Stable owner identifier returned by the configured OAuth provider. |
| `ADMIN_OWNER_PHONE` | Yes | Content Studio owner confirmation | Authorized phone value used by the existing local confirmation step. |
| `ADMIN_OWNER_PIN` | Yes | Content Studio owner confirmation | A private PIN; rotate it if it has been exposed. |

`VITE_*` variables are compiled into the browser build, so they must never contain database credentials, API keys, or other secrets. Vercel supports separate Local, Preview, and Production variable values; use a non-production database for Preview whenever possible.[2] [3]

## 3. Configure MongoDB Atlas

This repository uses the official MongoDB Node.js driver with a cached client that can be reused by warm Vercel Function instances. It creates the required unique indexes on first use and stores CMS data in the following collections: `users`, `portfolioSettings`, `portfolioMedia`, `caseStudies`, `ownerVerificationSessions`, and internal `portfolioCounters`. No database migration command is run during the Vercel build.

### Recommended: create Atlas through Vercel

In the [Vercel Marketplace](https://vercel.com/marketplace/mongodbatlas/atlas), install **MongoDB Atlas** for the Vercel team that owns this project. Create a cluster, select a region close to the intended Vercel function region, and connect the resulting Atlas resource to this Portfolio project. The native integration adds `MONGODB_URI` to the selected Vercel environments automatically.[5]

For this portfolio, an Atlas Free cluster is sufficient for initial Content Studio use. Connect the resource to both Production and Preview only if Preview should persist editable CMS changes; otherwise, connect it to Production and configure a separate preview database later.

### Alternative: connect an existing Atlas cluster

Create a database user with `readWrite` access to the selected portfolio database, such as `sani_portfolio`. Copy the **Drivers → Node.js** connection string, replace its placeholders locally, and add the completed URI in Vercel as the `MONGODB_URI` secret for Production and Preview. Do not paste it into source code, GitHub issues, or chat.

Vercel Functions use dynamic outbound IP addresses. When you connect Atlas directly, configure an Atlas IP Access List rule that permits Vercel connectivity. MongoDB documents that the Vercel integration uses `0.0.0.0/0` because of these dynamic addresses; this permits connections from anywhere, so use strong, unique database credentials and grant only the minimum database role.[5] [6]

## 4. Configure OAuth before enabling Content Studio

The login flow calculates its redirect URI from the current origin. Register the following callback URI with the same OAuth/Manus application that supplies `VITE_APP_ID`:

```text
https://YOUR-VERCEL-DOMAIN/api/oauth/callback
```

Add Preview callback URLs only if your OAuth provider allows them. The existing application signs a secure, same-site OAuth nonce cookie before redirecting; use HTTPS and do not change the callback path.

If the OAuth provider is restricted to Manus hosting or cannot register the Vercel domain, the public portfolio can still deploy, but authenticated Content Studio and owner verification will not work until you replace the provider or register a Vercel-compatible OAuth client.

## 5. Migrate media before fully leaving Manus

`/manus-storage/*` files currently depend on Manus Forge storage. The included `vercel.json` keeps existing image and resume links working through a temporary rewrite to the published Manus site. This avoids broken media during the first Vercel deploy, but it means the Vercel site still has a media dependency on Manus.

For a fully independent Vercel deployment, copy the portrait, project images, and resume PDF to Vercel Blob, Amazon S3, Cloudflare R2, or another object-storage provider. Update their URLs in Content Studio, remove the `/manus-storage` rewrite, and replace upload handling in `server/storage.ts` and `server/_core/storageProxy.ts` with the selected provider.

## 6. Deploy and verify

After adding environment variables and registering OAuth, deploy from the Vercel dashboard or CLI:

```bash
pnpm install
pnpm build:client
vercel
vercel --prod
```

Test the following in the Preview deployment before assigning a production domain:

1. Open `/` and refresh `/admin` to verify SPA deep links.
2. Confirm `/api/trpc` responds and the public portfolio loads its content.
3. Sign in through OAuth and confirm the callback returns to the Vercel domain.
4. Verify the Content Studio owner confirmation, a content save, the resume download, and every media asset.

Use `vercel env pull` after linking a local clone to fetch Development settings for local Vercel testing.[2]

### Local Vercel runtime check

From a terminal that has a persisted Vercel CLI login, run the following after importing the repository into Vercel:

```bash
vercel login
vercel dev --listen 3101
```

Then confirm `http://localhost:3101/api/oauth/callback` returns the application's JSON validation response (HTTP `400` when no `code` and `state` are supplied), and refresh `http://localhost:3101/admin` to confirm the SPA fallback. If the CLI reports that it is logged out, rerun `vercel login` and complete the device authorization in the **same terminal session** before starting `vercel dev`.

## References

[1]: https://vercel.com/docs/frameworks/backend/express "Express on Vercel"
[2]: https://vercel.com/docs/deployments/environments "Vercel deployment environments"
[3]: https://vercel.com/docs/environment-variables "Vercel environment variables"
[4]: https://vercel.com/docs/frameworks/frontend/vite "Vite on Vercel"
[5]: https://www.mongodb.com/docs/atlas/reference/partner-integrations/vercel/ "MongoDB Atlas: Integrate with Vercel"
[6]: https://www.mongodb.com/docs/atlas/security/ip-access-list/ "MongoDB Atlas: Configure IP Access List Entries"
