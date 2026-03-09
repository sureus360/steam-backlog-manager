import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { steamId: session.steamId } });
  if (!user) return NextResponse.json({ error: "User nicht gefunden" }, { status: 404 });

  return NextResponse.json({
    email: user.email,
    emailNotify: user.emailNotify,
    notifyDay: user.notifyDay,
    notifyHour: user.notifyHour,
  });
}

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });

  const { email, emailNotify, notifyDay, notifyHour } = await req.json();
  await prisma.user.update({
    where: { steamId: session.steamId },
    data: {
      ...(email !== undefined && { email }),
      ...(emailNotify !== undefined && { emailNotify }),
      ...(notifyDay !== undefined && { notifyDay }),
      ...(notifyHour !== undefined && { notifyHour: Number(notifyHour) }),
    },
  });
  return NextResponse.json({ ok: true });
}
