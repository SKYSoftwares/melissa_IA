import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
const prisma = new PrismaClient();

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json(
      { status: false, error: "Não autenticado" },
      { status: 401 }
    );
  }
  try {
    // Buscar campanhas que já tiveram mensagens enviadas
    const activeCampaigns = await prisma.campaing.findMany({
      where: {
        userId: session.user.id,
        id: {
          in: (
            await prisma.campaignDispatch.findMany({
              select: { campaignId: true },
              distinct: ["campaignId"],
            })
          ).map((d) => d.campaignId),
        },
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        delay: true,
        contactDelay: true,
        createdAt: true,
        updatedAt: true,
        status: true,
        _count: {
          select: { templates: true },
        },
        templates: {
          select: {
            template: { select: { id: true, name: true } },
          },
        },
      },
    });

    // Enriquecer com estatísticas
    const withStats = await Promise.all(
      activeCampaigns.map(async (c) => {
        const stats = await prisma.campaignDispatch.groupBy({
          by: ["status"],
          where: { campaignId: c.id },

          _count: { _all: true },
        });

        const scheduled = await prisma.campaignDispatch.findFirst({
          where: {
            campaignId: c.id,
          },
          select: {
            scheduledAt: true,
          },
        });

        const counters: Record<string, number> = {};
        stats.forEach((s) => {
          counters[s.status] = s._count._all;
        });
        // remova as que comecam com agendado_

        return {
          ...c,
          stats: {
            sent: counters["sent"] || 0,
            pending: counters["pending"] || 0,
            failed: counters["failed"] || 0,
          },
          scheduledAt: scheduled?.scheduledAt,
        };
      })
    );
    const filteredCampaigns = withStats.filter(
      (c) => !c.name.startsWith("agendado_")
    );
    return NextResponse.json({ status: true, campaigns: filteredCampaigns });
  } catch (err: any) {
    console.error("Erro ao buscar campanhas ativas:", err);
    return NextResponse.json(
      { status: false, error: err.message },
      { status: 500 }
    );
  }
}
