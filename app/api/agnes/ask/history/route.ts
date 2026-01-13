// app/api/agnes/history/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const allowPublic = process.env.ALLOW_PUBLIC_AGNES === "1";

  const session = await getServerSession(authOptions).catch(() => null);

  if (!session?.user?.email && !allowPublic) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let effectiveUserId = "public";

  if (session?.user?.email) {
    // Buscar usuário Team pelo email (como nas outras APIs)
    const me = await prisma.team.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (me) {
      effectiveUserId = me.id;
    }
  }

  const { searchParams } = new URL(req.url);
  const limit = Math.min(Number(searchParams.get("limit") ?? 50), 200);

  const history = await prisma.kbMessage.findMany({
    where: { userId: effectiveUserId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return NextResponse.json({ history });
}
