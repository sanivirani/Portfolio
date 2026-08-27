import { AXIOS_TIMEOUT_MS, COOKIE_NAME, ONE_YEAR_MS, OAUTH_STATE_COOKIE, decodeOAuthState, encodeOAuthState } from "@shared/const";
import axios from "axios";
import { parse as parseCookieHeader } from "cookie";
import { randomUUID } from "crypto";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { ENV } from "./env";
import { sdk } from "./sdk";
import { contentStudioLoginHrefForOrigin } from "../../shared/contentStudioRouting";

type GitHubUser = {
  id: number;
  login: string;
  name?: string | null;
  email?: string | null;
};

function requestOrigin(req: Request) {
  const forwardedProto = req.headers["x-forwarded-proto"];
  const protocol = typeof forwardedProto === "string"
    ? forwardedProto.split(",")[0].trim()
    : req.protocol;
  const host = req.get("host");
  return host ? `${protocol}://${host}` : "";
}

export function githubCallbackUrl(origin: string) {
  return `${origin}/api/oauth/callback`;
}

export function buildGitHubAuthorizationUrl(input: {
  clientId: string;
  redirectUri: string;
  state: string;
}) {
  const url = new URL("https://github.com/login/oauth/authorize");
  url.searchParams.set("client_id", input.clientId);
  url.searchParams.set("redirect_uri", input.redirectUri);
  url.searchParams.set("state", input.state);
  url.searchParams.set("scope", "read:user");
  url.searchParams.set("allow_signup", "false");
  return url.toString();
}

export function matchesGitHubAdminLogin(login: string, configuredLogin: string) {
  return Boolean(login && configuredLogin)
    && login.trim().toLowerCase() === configuredLogin.trim().toLowerCase();
}

function missingGitHubConfiguration(res: Response) {
  res.status(503).json({ error: "GitHub OAuth is not configured" });
}

function validCallbackState(req: Request, state: string) {
  const decoded = decodeOAuthState(state);
  const expectedNonce = parseCookieHeader(req.headers.cookie ?? "")[OAUTH_STATE_COOKIE];
  const callbackUrl = githubCallbackUrl(requestOrigin(req));
  return Boolean(decoded.nonce && expectedNonce && decoded.nonce === expectedNonce && decoded.redirectUri === callbackUrl);
}

export function registerOAuthRoutes(app: Express) {
  app.get("/api/oauth/github", (req, res) => {
    if (!ENV.githubOauthClientId) {
      const productionLoginUrl = contentStudioLoginHrefForOrigin(requestOrigin(req));
      if (productionLoginUrl !== "/api/oauth/github") {
        res.redirect(302, productionLoginUrl);
        return;
      }
      missingGitHubConfiguration(res);
      return;
    }
    const callbackUrl = githubCallbackUrl(requestOrigin(req));
    if (!callbackUrl || !callbackUrl.startsWith("https://")) {
      res.status(400).json({ error: "A secure OAuth callback origin is required" });
      return;
    }
    const nonce = randomUUID();
    const state = encodeOAuthState({ redirectUri: callbackUrl, nonce });
    res.cookie(OAUTH_STATE_COOKIE, nonce, {
      ...getSessionCookieOptions(req),
      httpOnly: true,
      maxAge: 10 * 60 * 1000,
    });
    res.redirect(302, buildGitHubAuthorizationUrl({
      clientId: ENV.githubOauthClientId,
      redirectUri: callbackUrl,
      state,
    }));
  });

  app.get("/api/oauth/callback", async (req, res) => {
    const code = typeof req.query.code === "string" ? req.query.code : undefined;
    const state = typeof req.query.state === "string" ? req.query.state : undefined;
    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }
    if (!validCallbackState(req, state)) {
      res.status(403).json({ error: "invalid oauth state" });
      return;
    }
    if (!ENV.githubOauthClientId || !ENV.githubOauthClientSecret || !ENV.githubAdminLogin || !ENV.cookieSecret) {
      missingGitHubConfiguration(res);
      return;
    }

    res.clearCookie(OAUTH_STATE_COOKIE, { ...getSessionCookieOptions(req), maxAge: 0 });
    try {
      const callbackUrl = githubCallbackUrl(requestOrigin(req));
      const tokenResponse = await axios.post<{ access_token?: string }>(
        "https://github.com/login/oauth/access_token",
        {
          client_id: ENV.githubOauthClientId,
          client_secret: ENV.githubOauthClientSecret,
          code,
          redirect_uri: callbackUrl,
        },
        { headers: { Accept: "application/json" }, timeout: AXIOS_TIMEOUT_MS },
      );
      const accessToken = tokenResponse.data.access_token;
      if (!accessToken) throw new Error("GitHub did not return an access token");

      const profileResponse = await axios.get<GitHubUser>("https://api.github.com/user", {
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${accessToken}`,
          "User-Agent": "sani-virani-portfolio",
        },
        timeout: AXIOS_TIMEOUT_MS,
      });
      const profile = profileResponse.data;
      if (!profile.login || !Number.isInteger(profile.id)) throw new Error("GitHub profile is incomplete");
      if (!matchesGitHubAdminLogin(profile.login, ENV.githubAdminLogin)) {
        res.status(403).json({ error: "This GitHub account is not authorized for Content Studio" });
        return;
      }

      const openId = `github:${profile.id}`;
      await db.upsertUser({
        openId,
        name: profile.name || profile.login,
        email: profile.email ?? null,
        loginMethod: "github",
        role: "admin",
        lastSignedIn: new Date(),
      });
      // The OAuth app accepts only the configured GitHub owner. A successful
      // sign-in therefore replaces the former separate phone/PIN prompt.
      await db.markOwnerVerified(
        (await db.getUserByOpenId(openId))!.id,
        new Date(Date.now() + ONE_YEAR_MS),
      );
      const sessionToken = await sdk.createSessionToken(openId, {
        name: profile.name || profile.login,
        expiresInMs: ONE_YEAR_MS,
      });
      res.cookie(COOKIE_NAME, sessionToken, { ...getSessionCookieOptions(req), maxAge: ONE_YEAR_MS });
      res.redirect(302, "/admin");
    } catch (error) {
      console.error("[GitHub OAuth] Callback failed", error);
      res.status(500).json({ error: "GitHub OAuth callback failed" });
    }
  });
}
