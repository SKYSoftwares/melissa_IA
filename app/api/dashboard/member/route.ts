// app/api/dashboard/member/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import {
  getPeriodRange,
  LEAD_STATUS_LABELS,
  PROPOSAL_STAGE_LABELS,
} from "@/lib/dashboardScope";

declare global {
  var prisma: PrismaClient | undefined;
}
const prisma = globalThis.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") globalThis.prisma = prisma;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const memberId = searchParams.get("id");
    const period = searchParams.get("period") || "mes";

    if (!memberId) {
      return NextResponse.json(
        { ok: false, error: "id do membro é obrigatório" },
        { status: 400 }
      );
    }

    const member = await prisma.team.findUnique({
      where: { id: memberId },
      select: { id: true, name: true, email: true, position: true },
    });

    if (!member) {
      return NextResponse.json(
        { ok: false, error: "Membro não encontrado" },
        { status: 404 }
      );
    }

    const { start, end } = getPeriodRange(period);

    // === Totais do membro ===
    const [totalLeads, totalProposals, totalSigned] = await Promise.all([
      prisma.lead.count({
        where: { createdBy: memberId, createdAt: { gte: start, lte: end } },
      }),
      prisma.proposal.count({
        where: { createdBy: memberId, createdAt: { gte: start, lte: end } },
      }),
      prisma.proposal.count({
        where: {
          createdBy: memberId,
          createdAt: { gte: start, lte: end },
          stage: "assinatura",
        },
      }),
    ]);

    // === Leads agrupados por status ===
    const leadsByStatusRaw = await prisma.lead.groupBy({
      by: ["status"],
      _count: { status: true },
      where: { createdBy: memberId, createdAt: { gte: start, lte: end } },
    });

    const leadsByStatus = leadsByStatusRaw.map((r) => ({
      status: r.status,
      count: r._count.status,
      label: LEAD_STATUS_LABELS[r.status] || r.status,
    }));

    // === Propostas agrupadas por estágio ===
    const proposalsByStageRaw = await prisma.proposal.groupBy({
      by: ["stage"],
      _count: { stage: true },
      where: { createdBy: memberId, createdAt: { gte: start, lte: end } },
    });

    const proposalsByStage = proposalsByStageRaw.map((r) => ({
      stage: r.stage,
      count: r._count.stage,
      label: PROPOSAL_STAGE_LABELS[r.stage] || r.stage,
    }));

    // === Série temporal individual ===
    const [periodLeads, periodProposals] = await Promise.all([
      prisma.lead.findMany({
        where: { createdBy: memberId, createdAt: { gte: start, lte: end } },
        select: { createdAt: true },
      }),
      prisma.proposal.findMany({
        where: { createdBy: memberId, createdAt: { gte: start, lte: end } },
        select: { createdAt: true, stage: true },
      }),
    ]);

    const dayKey = (d: Date) => d.toISOString().slice(0, 10);
    const timeseries: Record<
      string,
      { date: string; leads: number; proposals: number; signed: number }
    > = {};

    for (const l of periodLeads) {
      const k = dayKey(l.createdAt);
      timeseries[k] = timeseries[k] || {
        date: k,
        leads: 0,
        proposals: 0,
        signed: 0,
      };
      timeseries[k].leads += 1;
    }
    for (const p of periodProposals) {
      const k = dayKey(p.createdAt);
      timeseries[k] = timeseries[k] || {
        date: k,
        leads: 0,
        proposals: 0,
        signed: 0,
      };
      timeseries[k].proposals += 1;
      if (p.stage === "assinatura") timeseries[k].signed += 1;
    }

    const evolution = Object.values(timeseries).sort((a, b) =>
      a.date.localeCompare(b.date)
    );

    return NextResponse.json({
      ok: true,
      data: {
        member,
        totals: {
          leads: totalLeads,
          proposals: totalProposals,
          signed: totalSigned,
        },
        leadsByStatus,
        proposalsByStage,
        evolution,
      },
    });
  } catch (error: any) {
    console.error("Erro em /api/dashboard/member:", error);
    return NextResponse.json(
      { ok: false, error: error?.message || "Erro ao buscar dados do membro" },
      { status: 500 }
    );
  }
}
