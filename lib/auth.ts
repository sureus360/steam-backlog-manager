/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import { prisma } from "./db";

// Steam OpenID custom OAuth provider for next-auth v4
function SteamProvider() {
  const NEXTAUTH_URL = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  return {
    id: "steam",
    name: "Steam",
    type: "oauth",
    authorization: {
      url: "https://steamcommunity.com/openid/login",
      params: {
        "openid.ns": "http://specs.openid.net/auth/2.0",
        "openid.mode": "checkid_setup",
        "openid.return_to": `${NEXTAUTH_URL}/api/auth/callback/steam`,
        "openid.realm": NEXTAUTH_URL,
        "openid.identity": "http://specs.openid.net/auth/2.0/identifier_select",
        "openid.claimed_id": "http://specs.openid.net/auth/2.0/identifier_select",
      },
    },
    token: {
      url: "https://steamcommunity.com/openid/login",
      async request(context: any) {
        const params: Record<string, string> = {};
        for (const [k, v] of Object.entries(context.params ?? {})) {
          params[k] = String(v);
        }
        params["openid.mode"] = "check_authentication";

        const verifyRes = await fetch("https://steamcommunity.com/openid/login", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams(params).toString(),
        });
        const verifyText = await verifyRes.text();
        if (!verifyText.includes("is_valid:true")) {
          throw new Error("Steam OpenID verification failed");
        }

        const claimedId = params["openid.claimed_id"] ?? "";
        const steamId = claimedId.replace("https://steamcommunity.com/openid/id/", "");
        return { tokens: { access_token: steamId, token_type: "bearer" } };
      },
    },
    userinfo: {
      url: "https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/",
      async request(context: any) {
        const steamId = context.tokens.access_token as string;
        const key = process.env.STEAM_API_KEY;
        const res = await fetch(
          `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${key}&steamids=${steamId}`
        );
        const data = await res.json();
        const player = data?.response?.players?.[0] ?? {};
        return { ...player, sub: steamId, id: steamId };
      },
    },
    profile(profile: any) {
      return {
        id: profile.sub,
        name: profile.personaname,
        image: profile.avatarfull,
        steamId: profile.sub,
      };
    },
    clientId: "no-client-id",
    clientSecret: "no-client-secret",
    checks: ["none"],
    idToken: false,
  } as any;
}

export const authOptions: NextAuthOptions = {
  providers: [SteamProvider()],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt(params) {
      const { token, profile } = params as any;
      if (profile?.sub) {
        const steamId = String(profile.sub);
        token.steamId = steamId;

        await prisma.user.upsert({
          where: { steamId },
          update: {
            name: String(profile.personaname ?? ""),
            avatar: String(profile.avatarfull ?? ""),
          },
          create: {
            steamId,
            name: String(profile.personaname ?? ""),
            avatar: String(profile.avatarfull ?? ""),
          },
        });
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).steamId = token.steamId as string;
        (session.user as any).id = token.sub ?? "";
      }
      return session;
    },
  },
  pages: { signIn: "/", error: "/" },
  secret: process.env.NEXTAUTH_SECRET,
};

export async function auth() {
  return getServerSession(authOptions);
}
