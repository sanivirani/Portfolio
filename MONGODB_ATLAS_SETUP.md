# MongoDB Atlas Setup for the Portfolio on Vercel

This guide connects the Portfolio project to a new MongoDB Atlas database from the beginning. The portfolio is already live at **https://portfolio-henna-nu-35.vercel.app**, and its server code is already prepared to use MongoDB. Completing this guide enables persistent Content Studio data, including site settings, case studies, media metadata, users, and owner-verification sessions.

> **Do not paste passwords, database URIs, JWT secrets, PINs, or tokens into chat or GitHub.** Enter connection secrets only in the Vercel Environment Variables interface.

## 1. What You Need Before Starting

You need access to the **Sani Virani's projects** Vercel team and the **Portfolio** Vercel project. You also need to be able to accept the MongoDB Atlas integration terms. The Vercel account already has the MongoDB Atlas integration installed, so the recommended route is to use that existing integration rather than manually copying a connection string.

| Item | Use for this project | Recommended value |
|---|---|---|
| Vercel project | The deployed portfolio application | `portfolio` |
| MongoDB database | Persistent application data | `sani_portfolio` |
| Atlas resource name | A readable name in the integration console | `sani-portfolio-db` |
| Cluster tier | Small editorial CMS workload | **Free** ($0) |
| Location | Keep database near the Vercel function | A US East region, preferably the region Vercel suggests |
| Required environment variable | Secure server-to-database connection | `MONGODB_URI` |

The native Vercel integration provisions Atlas resources, handles the Atlas/Vercel sign-in flow, and automatically writes `MONGODB_URI` into connected Vercel environments.[1]

## 2. Recommended Route: Create Atlas Through the Existing Vercel Integration

### Step 1 — Open the MongoDB Atlas integration

Open the Portfolio project in Vercel and navigate to **Integrations**. Select **MongoDB Atlas**, then select **Open in MongoDB Atlas**. This opens the Atlas organization associated with the existing Vercel integration. If prompted, accept the integration terms and either create a new Atlas account or link your existing Atlas account.

The user who initially provisions or links the integration becomes the Atlas organization owner. If you use Google, GitHub, or another existing Atlas login, Atlas can ask you to link that account to the Vercel integration before it continues.[1]

### Step 2 — Create the database resource

In the Atlas/Vercel integration flow, choose to create a MongoDB Atlas cluster. Use the following selections. A Free cluster is appropriate for the present portfolio workload and does not require a credit card when the Free installation plan is chosen.[1]

| Screen or prompt | Select or enter |
|---|---|
| Cluster tier | **Free** |
| Installation plan | **Free plan ($0)** |
| Region | A nearby US East region; accept the mapped Vercel region if it is offered |
| Database name | **`sani_portfolio`** |
| Resource name | `sani-portfolio-db` |
| Project connection | **Portfolio** |

Review the summary carefully before you select **Create MongoDB Atlas Cluster**. The screen should show a $0 Free plan. Do not choose **Flex** or **Dedicated** unless you intentionally want a paid database plan; those tiers can incur hourly costs.[1]

### Step 3 — Wait until Atlas reports that the resource is available

After creation, the integration can show an **Initializing** status. Wait until it becomes **Available**. Atlas may take a few minutes to provision the cluster. Do not attempt to add a manual URI while the resource is still initializing.

### Step 4 — Confirm Vercel created the connection variable

Return to Vercel and open:

`Portfolio → Settings → Environment Variables`

Find an environment variable called **`MONGODB_URI`**. Confirm that it is assigned to both **Production** and **Preview**. The value is intentionally masked; you do not need to reveal or copy it. The integration creates this secure variable after the Atlas resource is linked to the project.[1]

If the variable is missing, return to the MongoDB Atlas integration and check that the resource is linked specifically to **Portfolio**, not merely installed for the Vercel team.

### Step 5 — Do not add `MONGODB_DB` unless you need to override it

The code uses the database name embedded in the URI. If the integration provides a URI without a database name, the application automatically uses **`sani_portfolio`**. You therefore do **not** need to create `MONGODB_DB` for the recommended setup. If you intentionally use another database name later, add `MONGODB_DB` in Vercel with that name.

### Step 6 — Request a redeployment after `MONGODB_URI` appears

In Vercel, open **Deployments**, select the most recent production deployment, and select **Redeploy**. A redeployment makes the newly created `MONGODB_URI` available to the serverless function. The database collections and indexes are created automatically when the application first needs them; no manual database-table migration is required.

## 3. What the Native Integration Configures

The Vercel native integration is the preferred setup because Atlas creates a Vercel-managed Atlas project and cluster and adds the connection credentials to Vercel environments.[1] It also supports direct Atlas access through the **Open in MongoDB Atlas** option.

| Configuration area | Native integration behavior | What you should check |
|---|---|---|
| Application connection | Creates `MONGODB_URI` | Present for Production and Preview |
| Network access | Atlas requires all Vercel dynamic egress IPs and adds `0.0.0.0/0` when absent | Confirm the resource is managed by the integration |
| Atlas database user | Creates an application database user for the resource | Keep credentials private; do not edit unless necessary |
| Database collections | The portfolio application creates collections and indexes on first use | No manual schema import is needed |
| Cost | Free, Flex, and Dedicated tiers are offered | Confirm **Free** before creating |

Atlas documents that Vercel uses dynamic IP addresses and that the native integration requires an Atlas IP allow-list entry for all addresses (`0.0.0.0/0`). Atlas warns that this broad rule permits connections from anywhere, so strong credentials and minimal database access are essential.[1] [4]

## 4. Alternative Route: Use an Existing Atlas Account Directly

Use this route only if you do not want the Vercel native integration to manage billing or if you already have an Atlas project. You will create the cluster and user yourself, then add the resulting connection URI to Vercel.

### Step 1 — Create or choose an Atlas project

Sign in at [MongoDB Atlas](https://cloud.mongodb.com/) and create a project named `Sani Portfolio`, or use an existing project dedicated to this website. Choose **Build a Database**, select the **Free** tier, choose an appropriate cloud region, and create the deployment.

### Step 2 — Create a least-privilege database user

Open **Database & Network Access → Database Users → Add New Database User**. Choose **Password** authentication, generate a long password, and store it in a password manager. Assign `readWrite` access to the `sani_portfolio` database only. Atlas documents that database users are different from people who can log in to the Atlas dashboard, and their access is controlled by assigned database roles.[2]

### Step 3 — Configure network access deliberately

Open **Database & Network Access → IP Access List → Add IP Address**. Vercel serverless deployments use dynamic IP addresses, so a direct Atlas connection normally needs the `0.0.0.0/0` CIDR rule. Atlas explicitly warns that this permits access from any internet address; pair it with a unique strong database password, a database-scoped user, and a database reserved for this application.[1] [4]

For a more restrictive production architecture, use a Vercel/Atlas private networking option when your plan and deployment design support it. Do not add your home IP alone: the Vercel production function will still be unable to reach Atlas.

### Step 4 — Obtain the Node.js connection string

In Atlas, open **Database → Connect → Drivers**, select **Node.js**, and copy the `mongodb+srv://...` URI. Replace the username, password, and database-name placeholders locally. The URI should include `sani_portfolio`, for example:

```text
mongodb+srv://<database-user>:<database-password>@<cluster-address>/sani_portfolio?retryWrites=true&w=majority
```

If the password contains characters such as `@`, `:`, `/`, or `?`, URL-encode those characters before placing the password in the URI. Never commit the URI to `.env` files that could reach GitHub.

### Step 5 — Add the URI to Vercel without exposing it

In Vercel, open `Portfolio → Settings → Environment Variables`, then add:

| Field | Enter |
|---|---|
| Name | `MONGODB_URI` |
| Value | The full private `mongodb+srv://...` connection string |
| Environments | **Production** and **Preview** |

Save the value and redeploy the most recent production deployment. You do not need to send the URI to the developer or add it to GitHub.

## 5. Remaining Vercel Variables for Content Studio

MongoDB makes persistent data possible, but Content Studio sign-in and owner verification also require the following variables. Add these directly in `Portfolio → Settings → Environment Variables` after the database works. Use different secure values from the previous hosting environment; do not copy hidden values from another platform.

| Variable | Purpose | Where it comes from |
|---|---|---|
| `MONGODB_URI` | Atlas database connection | Native integration or direct Atlas URI |
| `JWT_SECRET` | Signs the session cookie | Generate a new high-entropy secret and keep it private |
| `VITE_APP_ID` | OAuth application identifier used by the browser | Your OAuth application configuration |
| `VITE_OAUTH_PORTAL_URL` | Browser login portal URL | Your OAuth application configuration |
| `OAUTH_SERVER_URL` | Server-side OAuth service base URL | Your OAuth application configuration |
| `OWNER_OPEN_ID` | Authorizes the portfolio owner as admin | OAuth provider’s owner identifier |
| `ADMIN_OWNER_PHONE` | Second factor for the owner-confirmation step | Your chosen private phone value |
| `ADMIN_OWNER_PIN` | Second factor for the owner-confirmation step | A new private PIN |

Register this exact production OAuth callback URL with the OAuth provider before testing Content Studio login:

```text
https://portfolio-henna-nu-35.vercel.app/api/oauth/callback
```

## 6. Verification Checklist After Atlas Is Connected

Once `MONGODB_URI` is present and you have redeployed, use this checklist. The public site already works without the database; these checks confirm that Content Studio now has durable storage.

| Check | Expected result |
|---|---|
| Open `https://portfolio-henna-nu-35.vercel.app/` | Portfolio loads successfully |
| Open `https://portfolio-henna-nu-35.vercel.app/admin` | Content Studio interface loads |
| Sign in to Content Studio | OAuth returns to the same Vercel domain after its callback is registered |
| Change an editable label and save | Save succeeds without a database connection error |
| Refresh the public homepage | The saved content remains visible |
| Open `/api/oauth/callback` without parameters | The function returns HTTP 400 with `{"error":"code and state are required"}`; this confirms API routing, not login completion |

## 7. Troubleshooting

| Symptom | Likely cause | Resolution |
|---|---|---|
| `MONGODB_URI` does not appear in Vercel | The resource is not linked to Portfolio or is still initializing | Wait for **Available**, then link the resource to the Portfolio project |
| Database connection timeout | Atlas network access is not configured for Vercel’s dynamic IPs | Use the native integration or allow `0.0.0.0/0` only with strong credentials and least privilege |
| Authentication failed | Wrong password, malformed URI, or special characters were not URL-encoded | Reset the database-user password, encode special characters, and replace the Vercel value |
| No saved data after editing Content Studio | The app was not redeployed after `MONGODB_URI` was added, or OAuth admin variables are missing | Redeploy, then configure and verify the OAuth/admin variables in Section 5 |
| You see unexpected charges | A Flex or Dedicated plan was selected | Review Atlas/Vercel resource tier and move to the Free plan if appropriate |

## 8. What to Send Back

When you finish the Atlas setup, do **not** send secrets. Reply only with:

> **Atlas connected — `MONGODB_URI` is visible in Vercel for Production and Preview.**

Then the connection can be verified safely, followed by the OAuth and Content Studio configuration.

## References

[1]: https://www.mongodb.com/docs/atlas/reference/partner-integrations/vercel/ "MongoDB Atlas — Integrate with Vercel"
[2]: https://www.mongodb.com/docs/atlas/security-add-mongodb-users/ "MongoDB Atlas — Configure Database Users"
[3]: https://www.mongodb.com/docs/atlas/getting-started/ "MongoDB Atlas — Get Started"
[4]: https://www.mongodb.com/docs/atlas/security/ip-access-list/ "MongoDB Atlas — Configure IP Access List Entries"
