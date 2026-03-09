import { NextRequest, NextResponse } from "next/server";
import { createSession } from "@/lib/session";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const base = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

  // Collect all openid params from the redirect
  const params: Record<string, string> = {};
  req.nextUrl.searchParams.forEach((v, k) => {
    params[k] = v;
  });

  // Verify the assertion with Steam
  const verifyParams = { ...params, "openid.mode": "check_authentication" };
  const verifyRes = await fetch("https://steamcommunity.com/openid/login", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(verifyParams).toString(),
  });
  const verifyText = await verifyRes.text();

  if (!verifyText.includes("is_valid:true")) {
    return NextResponse.redirect(`${base}/?error=auth_failed`);
  }

  // Extract Steam ID from claimed_id
  const claimedId = params["openid.claimed_id"] ?? "";
  const steamId = claimedId.replace("https://steamcommunity.com/openid/id/", "");

  if (!steamId || !/^\d+$/.test(steamId)) {
    return NextResponse.redirect(`${base}/?error=invalid_steamid`);
  }

  // Fetch Steam profile
  const profileRes = await fetch(
    `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${process.env.STEAM_API_KEY}&steamids=${steamId}`
  );
  const profileData = await profileRes.json();
  const player = profileData?.response?.players?.[0];

  if (!player) {
    return NextResponse.redirect(`${base}/?error=profile_failed`);
  }

  // Upsert user in DB
  await prisma.user.upsert({
    where: { steamId },
    update: { name: player.personaname, avatar: player.avatarfull },
    create: { steamId, name: player.personaname, avatar: player.avatarfull },
  });

  // Create session cookie
  await createSession({ steamId, name: player.personaname, avatar: player.avatarfull });

  return NextResponse.redirect(`${base}/dashboard`);
}
