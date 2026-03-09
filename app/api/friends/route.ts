import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

export interface FriendStats {
  steamId: string;
  name: string;
  avatar: string;
  profileUrl: string;
  totalGames: number;
  totalHours: number;
  topGame: { name: string; hours: number } | null;
  isPrivate: boolean;
}

async function getFriendList(steamId: string, apiKey: string): Promise<string[]> {
  const res = await fetch(
    `https://api.steampowered.com/ISteamUser/GetFriendList/v1/?key=${apiKey}&steamid=${steamId}&relationship=friend`
  );
  if (!res.ok) return [];
  const data = await res.json();
  return (data?.friendslist?.friends ?? []).map((f: { steamid: string }) => f.steamid);
}

async function getProfiles(steamIds: string[], apiKey: string) {
  if (steamIds.length === 0) return [];
  // Steam API max 100 per request
  const chunks: string[][] = [];
  for (let i = 0; i < steamIds.length; i += 100) chunks.push(steamIds.slice(i, i + 100));

  const profiles = [];
  for (const chunk of chunks) {
    const res = await fetch(
      `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${apiKey}&steamids=${chunk.join(",")}`
    );
    if (res.ok) {
      const data = await res.json();
      profiles.push(...(data?.response?.players ?? []));
    }
  }
  return profiles;
}

async function getGameStats(steamId: string, apiKey: string): Promise<{ totalGames: number; totalHours: number; topGame: { name: string; hours: number } | null; isPrivate: boolean }> {
  const res = await fetch(
    `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${apiKey}&steamid=${steamId}&include_appinfo=true`
  );
  if (!res.ok) return { totalGames: 0, totalHours: 0, topGame: null, isPrivate: true };
  const data = await res.json();
  const games = data?.response?.games;
  if (!games) return { totalGames: 0, totalHours: 0, topGame: null, isPrivate: true };

  const totalMinutes = games.reduce((s: number, g: { playtime_forever: number }) => s + g.playtime_forever, 0);
  const top = games.sort((a: { playtime_forever: number }, b: { playtime_forever: number }) => b.playtime_forever - a.playtime_forever)[0];

  return {
    totalGames: games.length,
    totalHours: Math.floor(totalMinutes / 60),
    topGame: top ? { name: top.name, hours: Math.floor(top.playtime_forever / 60) } : null,
    isPrivate: false,
  };
}

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });

  const apiKey = process.env.STEAM_API_KEY!;

  // Get my own stats first
  const [myStats, friendIds] = await Promise.all([
    getGameStats(session.steamId, apiKey),
    getFriendList(session.steamId, apiKey),
  ]);

  const meStat: FriendStats = {
    steamId: session.steamId,
    name: session.name + " (Du)",
    avatar: session.avatar,
    profileUrl: `https://steamcommunity.com/profiles/${session.steamId}`,
    ...myStats,
  };

  if (friendIds.length === 0) {
    return NextResponse.json({ isPrivate: true, friends: [meStat] });
  }

  // Limit to first 50 friends to avoid too many API calls
  const limitedFriendIds = friendIds.slice(0, 50);

  const profiles = await getProfiles(limitedFriendIds, apiKey);

  // Fetch game stats for friends in parallel (max 10 at a time to avoid rate limits)
  const friendStats: FriendStats[] = [];
  const batchSize = 10;
  for (let i = 0; i < profiles.length; i += batchSize) {
    const batch = profiles.slice(i, i + batchSize);
    const results = await Promise.all(
      batch.map(async (p: { steamid: string; personaname: string; avatarfull: string; profileurl: string }) => {
        const stats = await getGameStats(p.steamid, apiKey);
        return {
          steamId: p.steamid,
          name: p.personaname,
          avatar: p.avatarfull,
          profileUrl: p.profileurl,
          ...stats,
        } as FriendStats;
      })
    );
    friendStats.push(...results);
  }

  // Sort by total hours, put self at correct position
  const all = [meStat, ...friendStats].sort((a, b) => b.totalHours - a.totalHours);

  return NextResponse.json({ isPrivate: false, friends: all, total: friendIds.length });
}
