import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

function getSteamId(session: Awaited<ReturnType<typeof auth>>) {
  return (session?.user as { steamId?: string } | undefined)?.steamId;
}

export async function GET() {
  const session = await auth();
  const steamId = getSteamId(session);
  if (!steamId) return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { steamId },
    include: { pinnedGames: true },
  });
  return NextResponse.json(user?.pinnedGames ?? []);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const steamId = getSteamId(session);
  if (!steamId) return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });

  const { appId, note = "" } = await req.json();
  if (!appId) return NextResponse.json({ error: "appId fehlt" }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { steamId } });
  if (!user) return NextResponse.json({ error: "User nicht gefunden" }, { status: 404 });

  const pin = await prisma.pinnedGame.upsert({
    where: { userId_appId: { userId: user.id, appId: String(appId) } },
    update: { note },
    create: { userId: user.id, appId: String(appId), note },
  });
  return NextResponse.json(pin);
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  const steamId = getSteamId(session);
  if (!steamId) return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });

  const { appId } = await req.json();
  if (!appId) return NextResponse.json({ error: "appId fehlt" }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { steamId } });
  if (!user) return NextResponse.json({ error: "User nicht gefunden" }, { status: 404 });

  await prisma.pinnedGame.deleteMany({ where: { userId: user.id, appId: String(appId) } });
  return NextResponse.json({ ok: true });
}
