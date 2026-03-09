import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getOwnedGames } from "@/lib/steam";
import { sendBacklogDigest } from "@/lib/mailer";

// Called by a cron job - protected by NOTIFY_SECRET token
// Example: GET /api/notify?token=YOUR_SECRET
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (token !== process.env.NOTIFY_SECRET) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const now = new Date();
  const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const currentDay = days[now.getDay()];
  const currentHour = now.getHours();

  // Find all schedules that match current day+hour
  const schedules = await prisma.notificationSchedule.findMany({
    where: { day: currentDay, hour: currentHour },
    include: {
      user: { include: { pinnedGames: true } },
    },
  });

  const results = [];
  for (const schedule of schedules) {
    const user = schedule.user;
    if (!user.email || !user.steamId) continue;
    try {
      const games = await getOwnedGames(user.steamId);
      await sendBacklogDigest(user.email, user.name ?? "Spieler", user.pinnedGames, games);
      results.push({ userId: user.id, status: "sent" });
    } catch (err) {
      results.push({ userId: user.id, status: "error", error: String(err) });
    }
  }

  return NextResponse.json({ processed: schedules.length, results });
}

// Manual test send for current user
export async function POST(req: NextRequest) {
  const { steamId } = await req.json();

  const user = await prisma.user.findUnique({
    where: { steamId },
    include: { pinnedGames: true },
  });

  if (!user?.email) {
    return NextResponse.json({ error: "Keine E-Mail-Adresse hinterlegt" }, { status: 400 });
  }

  const games = await getOwnedGames(user.steamId);
  await sendBacklogDigest(user.email, user.name ?? "Spieler", user.pinnedGames, games);

  return NextResponse.json({ ok: true });
}
