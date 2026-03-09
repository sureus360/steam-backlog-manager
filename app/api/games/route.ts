import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getOwnedGames } from "@/lib/steam";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });

  const games = await getOwnedGames(session.steamId);
  return NextResponse.json([...games].sort((a, b) => b.playtime_forever - a.playtime_forever));
}
