export interface SteamGame {
  appid: number;
  name: string;
  playtime_forever: number; // in minutes
  playtime_2weeks?: number;
  img_icon_url: string;
  img_logo_url?: string;
}

export interface SteamProfile {
  steamid: string;
  personaname: string;
  avatarfull: string;
  profileurl: string;
}

const STEAM_API = "https://api.steampowered.com";
const STORE_API = "https://store.steampowered.com";

export async function getSteamProfile(steamId: string): Promise<SteamProfile | null> {
  const key = process.env.STEAM_API_KEY;
  const res = await fetch(
    `${STEAM_API}/ISteamUser/GetPlayerSummaries/v2/?key=${key}&steamids=${steamId}`,
    { next: { revalidate: 300 } }
  );
  if (!res.ok) return null;
  const data = await res.json();
  return data?.response?.players?.[0] ?? null;
}

export async function getOwnedGames(steamId: string): Promise<SteamGame[]> {
  const key = process.env.STEAM_API_KEY;
  const res = await fetch(
    `${STEAM_API}/IPlayerService/GetOwnedGames/v1/?key=${key}&steamid=${steamId}&include_appinfo=true&include_played_free_games=true`,
    { next: { revalidate: 300 } }
  );
  if (!res.ok) return [];
  const data = await res.json();
  return data?.response?.games ?? [];
}

export function getGameIconUrl(appId: number, iconHash: string): string {
  if (!iconHash) return `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/header.jpg`;
  return `https://media.steampowered.com/steamcommunity/public/images/apps/${appId}/${iconHash}.jpg`;
}

export function getGameHeaderUrl(appId: number): string {
  return `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/header.jpg`;
}

export function formatPlaytime(minutes: number): string {
  if (minutes < 60) return `${minutes} Min.`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) return `${hours} Std.`;
  return `${hours} Std. ${mins} Min.`;
}
