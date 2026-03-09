import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { steamId: session.steamId },
    include: { notificationSchedules: { orderBy: [{ day: "asc" }, { hour: "asc" }] } },
  });

  return NextResponse.json({
    email: user?.email ?? "",
    schedules: user?.notificationSchedules ?? [],
  });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });

  const { day, hour, email } = await req.json();

  const user = await prisma.user.findUnique({ where: { steamId: session.steamId } });
  if (!user) return NextResponse.json({ error: "User nicht gefunden" }, { status: 404 });

  // Update email if provided
  if (email !== undefined) {
    await prisma.user.update({ where: { id: user.id }, data: { email } });
  }

  if (!day || hour === undefined) return NextResponse.json({ error: "day und hour erforderlich" }, { status: 400 });

  const schedule = await prisma.notificationSchedule.upsert({
    where: { userId_day_hour: { userId: user.id, day, hour: Number(hour) } },
    update: {},
    create: { userId: user.id, day, hour: Number(hour) },
  });

  return NextResponse.json(schedule);
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "id fehlt" }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { steamId: session.steamId } });
  if (!user) return NextResponse.json({ error: "User nicht gefunden" }, { status: 404 });

  await prisma.notificationSchedule.deleteMany({ where: { id, userId: user.id } });
  return NextResponse.json({ ok: true });
}

export async function PUT(req: NextRequest) {
  // Update email only
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
  const { email } = await req.json();
  await prisma.user.update({ where: { steamId: session.steamId }, data: { email } });
  return NextResponse.json({ ok: true });
}
