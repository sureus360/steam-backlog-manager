import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getOwnedGames } from "@/lib/steam";

export async function GET() {
  const session = await auth();
  const steamId = (session?.user as { steamId?: string } | undefined)?.steamId;
  if (!steamId) {
    return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
  }

  const games = await getOwnedGames(steamId);
  const sorted = [...games].sort((a, b) => b.playtime_forever - a.playtime_forever);

  return NextResponse.json(sorted);
}
