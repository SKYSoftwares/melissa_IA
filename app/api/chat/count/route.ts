import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth"; // seu NextAuth config

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ total: 0 });
  }

  // 1️⃣ Pega as sessões desse usuário
  const userSessions = await prisma.whatsAppSession.findMany({
    where: { userId: session.user.id },
    select: { id: true },
  });
  const sessionIds = userSessions.map((s) => s.id);

  // 2️⃣ Conta apenas mensagens dessas sessões
  const total = await prisma.whatsAppMessage.count({
    where: { sessionId: { in: sessionIds }, archived: false },
  });

  return NextResponse.json({ total });
}
