# Vercel Deployment Guide

This repository now has a Vercel-ready build configuration. It separates the Vite client build from the Express application and exports a single serverless entrypoint for the existing same-origin API endpoints. The configured fallback excludes `/api/*` so API requests reach the Vercel Function, while client-side routes such as `/admin` resolve to the Vite application after a refresh.

> **Important:** The current Manus deployment remains the recommended live environment until the external database, OAuth callback, and media migration steps below are complete. The project currently uses Manus services for its published media and OAuth integration.

## 1. Import the repository

Export the project to GitHub from Manus, then import the repository in the [Vercel dashboard](https://vercel.com/new). Vercel will use the repository's `vercel.json`, run `pnpm build:client`, publish `dist/public`, and expose the Express application from the catch-all `/api/*` function. Vercel supports default-exported Express applications as Functions, while static files must be served from the deployment output rather than `express.static()`.[1]

The first Vercel deployment becomes Production; later pushes to the production branch deploy to Production, while other branches create Preview deployments.[2]

## 2. Add environment variables

In **Vercel Project Settings → Environment Variables**, add the values below to **Production** and **Preview**. Do not commit `.env`, `.env.local`, or real secret values. Vercel applies variable changes only to newly created deployments, so redeploy after changing a value.[3]

The repository intentionally does not include a committed `.env.example`, because its deployment tooling blocks environment files. Use the table below as the canonical template when creating variables in Vercel.

| Variable | Required | Where it is used | Vercel value guidance |
|---|---:|---|---|
| `DATABASE_URL` | Yes | Drizzle + `mysql2` data access | Use a public, TLS-enabled **MySQL-compatible** database URL. |
| `JWT_SECRET` | Yes | Session signing and verification | Generate a long random secret; use the same value for all Production instances. |
| `VITE_APP_ID` | Yes | Browser OAuth login start | OAuth application identifier. This value is visible in the client bundle. |
| `VITE_OAUTH_PORTAL_URL` | Yes | Browser OAuth login start | OAuth portal base URL, without a trailing callback path. This value is visible in the client bundle. |
| `OAUTH_SERVER_URL` | Yes | Server OAuth code exchange and profile lookup | OAuth provider API base URL. |
| `OWNER_OPEN_ID` | Yes | Owner/admin role assignment | Stable owner identifier returned by the configured OAuth provider. |
| `ADMIN_OWNER_PHONE` | Yes | Content Studio owner confirmation | Authorized phone value used by the existing local confirmation step. |
| `ADMIN_OWNER_PIN` | Yes | Content Studio owner confirmation | A private PIN; rotate it if it has been exposed. |

`VITE_*` variables are compiled into the browser build, so they must never contain database credentials, API keys, or other secrets. Vercel supports separate Local, Preview, and Production variable values; use a non-production database for Preview whenever possible.[2] [3]

## 3. Configure a database

The repository uses `drizzle-orm/mysql2`, so select a MySQL-compatible provider such as PlanetScale, TiDB Cloud, Amazon RDS for MySQL, or another managed MySQL service that accepts internet traffic from Vercel. **Do not use Vercel Postgres without migrating the schema and replacing `mysql2`.**

Create an empty database, obtain its TLS-enabled connection URI, and set it as `DATABASE_URL`. Apply schema changes outside the Vercel build step so a build never performs an unexpected migration:

```bash
pnpm install
export DATABASE_URL='your-production-mysql-connection-uri'
pnpm drizzle-kit generate
pnpm drizzle-kit migrate
```

For Preview deployments, use a separate Preview database or a branch/database feature from the chosen provider. Verify that the provider permits connections from Vercel's network and requires TLS where supported.

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
