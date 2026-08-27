# Vercel Deployment Guide

This repository has a Vercel-ready build configuration. It separates the Vite client build from the Express application and emits a self-contained CommonJS serverless entrypoint at `api/[...path].js` for the existing same-origin API endpoints. The `api/package.json` CommonJS boundary preserves Express dependency loading while keeping the artifact visible to Vercel as a standard JavaScript function. The configured fallback excludes `/api/*` so API requests reach the Vercel Function, while client-side routes such as `/admin` resolve to the Vite application after a refresh.

> **Current status:** The public portfolio is live at `https://portfolio-henna-nu-35.vercel.app`. MongoDB Atlas is linked through Vercel for Production and Preview, and the public portfolio API has been verified against the Atlas-backed data path. GitHub OAuth has been verified for the `sanivirani` administrator: sign-in reaches Content Studio, owner-gated content saves persist in MongoDB, and logout clears the session. Existing images and the resume still use the temporary Manus media rewrite described in Section 5.

## 1. Import the repository

Export the project to GitHub from Manus, then import the repository in the [Vercel dashboard](https://vercel.com/new). Vercel will use the repository's `vercel.json`, run `pnpm build:client`, publish `dist/public`, and expose the Express application from the generated catch-all `/api/*` function. The build regenerates this self-contained CommonJS function so Express dependencies retain Node's native module loading and runtime code does not depend on extensionless imports outside `api/`. Vercel supports default-exported Express applications as Functions, while static files must be served from the deployment output rather than `express.static()`.[1]

The first Vercel deployment becomes Production; later pushes to the production branch deploy to Production, while other branches create Preview deployments.[2]

## 2. Add environment variables

In **Vercel Project Settings → Environment Variables**, add `MONGODB_URI` to **Production** and **Preview**. Add the Content Studio OAuth and session values to **Production**. Preview GitHub login is intentionally not configured until there is a stable Preview callback domain. Do not commit `.env`, `.env.local`, or real secret values. Vercel applies variable changes only to newly created deployments, so redeploy after changing a value.[3]

The repository intentionally does not include a committed `.env.example`, because its deployment tooling blocks environment files. Use the table below as the canonical template when creating variables in Vercel.

| Variable | Required | Where it is used | Vercel value guidance |
|---|---:|---|---|
| `MONGODB_URI` | Yes | Cached MongoDB Atlas client and Content Studio collections | Use the Atlas `mongodb+srv://…` connection URI. Add it as a secret, never in the browser bundle. |
| `MONGODB_DB` | No | MongoDB database selection | Defaults to the database in `MONGODB_URI`, or `sani_portfolio` when no database name is present. |
| `JWT_SECRET` | Production Content Studio only | First-party session signing and verification | Generate a long random secret; use the same value for all Production instances. |
| `GITHUB_OAUTH_CLIENT_ID` | Production Content Studio only | Server-side GitHub authorization redirect | Client ID from the GitHub OAuth app. It is safe to treat this as configuration, but keeping it server-side avoids unnecessary browser exposure. |
| `GITHUB_OAUTH_CLIENT_SECRET` | Production Content Studio only | GitHub authorization-code exchange | Generate this in GitHub, store it as a Vercel secret, and never commit or paste it into chat. |
| `GITHUB_ADMIN_LOGIN` | Production Content Studio only | Administrator authorization | The exact GitHub username permitted to administer Content Studio, such as `sanivirani`. |

Vercel supports separate Local, Preview, and Production variable values; use a non-production database for Preview whenever possible.[2] [3]

## 3. Configure MongoDB Atlas

This repository uses the official MongoDB Node.js driver with a cached client that can be reused by warm Vercel Function instances. It creates the required unique indexes on first use and stores CMS data in the following collections: `users`, `portfolioSettings`, `portfolioMedia`, `caseStudies`, `ownerVerificationSessions`, and internal `portfolioCounters`. No database migration command is run during the Vercel build.

### Recommended: create Atlas through Vercel

In the [Vercel Marketplace](https://vercel.com/marketplace/mongodbatlas/atlas), install **MongoDB Atlas** for the Vercel team that owns this project. Create a cluster, select a region close to the intended Vercel function region, and connect the resulting Atlas resource to this Portfolio project. The native integration adds `MONGODB_URI` to the selected Vercel environments automatically.[5]

For this portfolio, an Atlas Free cluster is sufficient for initial Content Studio use. Connect the resource to both Production and Preview only if Preview should persist editable CMS changes; otherwise, connect it to Production and configure a separate preview database later.

### Alternative: connect an existing Atlas cluster

Create a database user with `readWrite` access to the selected portfolio database, such as `sani_portfolio`. Copy the **Drivers → Node.js** connection string, replace its placeholders locally, and add the completed URI in Vercel as the `MONGODB_URI` secret for Production and Preview. Do not paste it into source code, GitHub issues, or chat.

Vercel Functions use dynamic outbound IP addresses. When you connect Atlas directly, configure an Atlas IP Access List rule that permits Vercel connectivity. MongoDB documents that the Vercel integration uses `0.0.0.0/0` because of these dynamic addresses; this permits connections from anywhere, so use strong, unique database credentials and grant only the minimum database role.[5] [6]

## 4. Configure GitHub OAuth for Content Studio

The public portfolio does **not** require GitHub OAuth. When Content Studio editing is needed, create a GitHub OAuth App under the portfolio owner’s GitHub account and register the exact Vercel callback URI:

```text
https://portfolio-henna-nu-35.vercel.app/api/oauth/callback
```

Use `https://portfolio-henna-nu-35.vercel.app` as the homepage URL. The server requests only GitHub’s `read:user` scope, validates a one-time state cookie, exchanges the authorization code on the server, and issues its own signed first-party session. GitHub requires the `redirect_uri` at exchange time to match a registered callback URL.[7] [8]

The GitHub OAuth app named **Sani Virani Content Studio** is already registered for this production URL. Add its Client ID as `GITHUB_OAUTH_CLIENT_ID`, generate a Client Secret and add it as `GITHUB_OAUTH_CLIENT_SECRET`, set `GITHUB_ADMIN_LOGIN` to `sanivirani`, and create `JWT_SECRET` as a Vercel secret. GitHub sign-in is accepted only when the returned GitHub username matches `GITHUB_ADMIN_LOGIN`, so it also functions as the owner verification factor. Do not add phone or PIN values unless you later elect to restore the separate legacy verification flow.

For Preview deployments, GitHub OAuth is intentionally unconfigured until a stable Preview callback domain is selected and registered as a separate GitHub OAuth callback URL. Do not use a random Preview URL as the production callback.

## 5. Migrate media before fully leaving Manus

`/manus-storage/*` files currently depend on Manus Forge storage. The included `vercel.json` keeps existing image and resume links working through a temporary rewrite to the published Manus site. This avoids broken media during the first Vercel deploy, but it means the Vercel site still has a media dependency on Manus.

For a fully independent Vercel deployment, copy the portrait, project images, and resume PDF to Vercel Blob, Amazon S3, Cloudflare R2, or another object-storage provider. Update their URLs in Content Studio, remove the `/manus-storage` rewrite, and replace upload handling in `server/storage.ts` and `server/_core/storageProxy.ts` with the selected provider.

## 6. Deploy and verify

After adding or rotating Production variables, deploy from the Vercel dashboard or CLI:

```bash
pnpm install
pnpm build:client
vercel
vercel --prod
```

On Production, verify that `/` and refreshed `/admin` load as expected, `/api/trpc` serves the public portfolio, and `/api/oauth/callback` returns HTTP `400` JSON when `code` and `state` are absent. Sign in through GitHub using the configured administrator account and confirm the callback returns to `/admin`. Verify that an authorized Content Studio save persists and that logout returns `/admin` to its sign-in screen. Preview should continue to operate as a public portfolio and must not offer GitHub Content Studio login until a stable Preview callback has been configured.

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
[7]: https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app "GitHub Docs: Creating an OAuth app"
[8]: https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps "GitHub Docs: Authorizing OAuth apps"
