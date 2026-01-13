// app/api/dashboard/hierarchy/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import {
  brlToNumber,
  getPeriodRange,
  getTeamByEmail,
  resolveAccessibleUserIds,
  PROPOSAL_STAGE_LABELS,
  LEAD_STATUS_LABELS,
} from "@/lib/dashboardScope"; // ajuste se não usa alias "@/"

declare global {
  // evita múltiplas instâncias do Prisma em dev/HMR
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}
const prisma = globalThis.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") globalThis.prisma = prisma;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userEmail = searchParams.get("userEmail");
    const period = searchParams.get("period") || "mes";

    if (!userEmail) {
      return NextResponse.json(
        { ok: false, error: "userEmail é obrigatório" },
        { status: 400 }
      );
    }

    const me = await getTeamByEmail(userEmail);
    if (!me) {
      return NextResponse.json(
        { ok: false, error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    const { start, end } = getPeriodRange(period);
    const scope = await resolveAccessibleUserIds({
      id: me.id,
      position: me.position,
    });

    // === Contagens por status (escopo) ===
    const [leadsByStatusRaw, proposalsByStageRaw] = await Promise.all([
      prisma.lead.groupBy({
        by: ["status"],
        _count: { status: true },
        where: {
          createdBy: { in: scope.userIds },
          createdAt: { gte: start, lte: end },
        },
      }),
      prisma.proposal.groupBy({
        by: ["stage"],
        _count: { stage: true },
        where: {
          createdBy: { in: scope.userIds },
          createdAt: { gte: start, lte: end },
        },
      }),
    ]);

    // === Totais e contratos assinados (escopo) ===
    const [totalLeads, totalProposals, signedProposals] = await Promise.all([
      prisma.lead.count({
        where: {
          createdBy: { in: scope.userIds },
          createdAt: { gte: start, lte: end },
        },
      }),
      prisma.proposal.count({
        where: {
          createdBy: { in: scope.userIds },
          createdAt: { gte: start, lte: end },
        },
      }),
      prisma.proposal.findMany({
        where: {
          createdBy: { in: scope.userIds },
          createdAt: { gte: start, lte: end },
          stage: "assinatura",
        },
        select: { id: true, value: true, createdBy: true, createdAt: true },
      }),
    ]);

    const totalSignedValue = signedProposals.reduce(
      (acc, p) => acc + brlToNumber(p.value),
      0
    );

    // === Top Vendedores (pelo valor assinado) ===
    const signedByUser: Record<
      string,
      { userId: string; totalValue: number; count: number }
    > = {};
    for (const p of signedProposals) {
      const key = p.createdBy || "";
      if (!key) continue;
      if (!signedByUser[key]) {
        signedByUser[key] = { userId: key, totalValue: 0, count: 0 };
      }
      signedByUser[key].totalValue += brlToNumber(p.value);
      signedByUser[key].count += 1;
    }

    const usersMap = new Map(
      (
        await prisma.team.findMany({
          where: { id: { in: Object.keys(signedByUser) } },
          select: { id: true, name: true, email: true },
        })
      ).map((u) => [u.id, u])
    );

    const topSellers = Object.values(signedByUser)
      .map((s) => ({
        ...s,
        name: usersMap.get(s.userId)?.name || "—",
        email: usersMap.get(s.userId)?.email || "",
      }))
      .sort((a, b) => b.totalValue - a.totalValue)
      .slice(0, 10);

    // === Série temporal (escopo) ===
    const [periodLeads, periodProposals] = await Promise.all([
      prisma.lead.findMany({
        where: {
          createdBy: { in: scope.userIds },
          createdAt: { gte: start, lte: end },
        },
        select: { createdAt: true },
      }),
      prisma.proposal.findMany({
        where: {
          createdBy: { in: scope.userIds },
          createdAt: { gte: start, lte: end },
        },
        select: { createdAt: true, stage: true },
      }),
    ]);

    const dayKey = (d: Date) => d.toISOString().slice(0, 10); // YYYY-MM-DD (UTC)
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

    // === Leads por Gestor (apenas Admin/Diretor) ===
    let managersBreakdown: Array<{
      manager: { id: string; name: string; email: string };
      managerLeads: number;
      managerProposals: number;
      consultants: Array<{
        id: string;
        name: string;
        email: string;
        leads: number;
        proposals: number;
      }>;
      totalLeads: number;
      totalProposals: number;
    }> = [];

    const isAdmin = me.position === "Administrador";
    const isDirector = me.position === "Diretor";

    if (isAdmin || isDirector) {
      const managerIds = isAdmin
        ? (
            await prisma.team.findMany({
              where: { position: "Gerente" },
              select: { id: true },
            })
          ).map((m) => m.id)
        : scope.managerIds;

      if (managerIds.length > 0) {
        const managers = await prisma.team.findMany({
          where: { id: { in: managerIds } },
          select: { id: true, name: true, email: true },
        });

        const groups = await prisma.teamGroup.findMany({
          where: { managerId: { in: managerIds } },
          include: {
            members: { select: { id: true, name: true, email: true } },
          },
        });

        // pré-carrega contagens por usuário (no período)
        const [leadsAll, proposalsAll] = await Promise.all([
          prisma.lead.groupBy({
            by: ["createdBy"],
            _count: { _all: true },
            where: { createdAt: { gte: start, lte: end } },
          }),
          prisma.proposal.groupBy({
            by: ["createdBy"],
            _count: { _all: true },
            where: { createdAt: { gte: start, lte: end } },
          }),
        ]);

        const leadsMap = new Map(
          leadsAll.map((r) => [r.createdBy || "", r._count._all])
        );
        const propsMap = new Map(
          proposalsAll.map((r) => [r.createdBy || "", r._count._all])
        );

        managersBreakdown = managers.map((mgr) => {
          const group = groups.find((g) => g.managerId === mgr.id);
          const members = group?.members || [];
          const managerSelfLeads = leadsMap.get(mgr.id) || 0;
          const managerSelfProps = propsMap.get(mgr.id) || 0;

          const consultants = members.map((m) => ({
            id: m.id,
            name: m.name,
            email: m.email,
            leads: leadsMap.get(m.id) || 0,
            proposals: propsMap.get(m.id) || 0,
          }));

          const consultantsLeads = consultants.reduce((a, c) => a + c.leads, 0);
          const consultantsProps = consultants.reduce(
            (a, c) => a + c.proposals,
            0
          );

          return {
            manager: { id: mgr.id, name: mgr.name, email: mgr.email },
            managerLeads: managerSelfLeads,
            managerProposals: managerSelfProps,
            consultants,
            totalLeads: managerSelfLeads + consultantsLeads,
            totalProposals: managerSelfProps + consultantsProps,
          };
        });

        managersBreakdown.sort((a, b) => b.totalLeads - a.totalLeads);
      }
    }

    // === Resumo por Consultor (no escopo do usuário) ===
    const consultantsInScope = await prisma.team.findMany({
      where: { id: { in: scope.userIds } },
      select: { id: true, name: true, email: true, position: true },
    });
    const [leadsByUser, propsByUser, signedByUserCount] = await Promise.all([
      prisma.lead.groupBy({
        by: ["createdBy"],
        _count: { _all: true },
        where: {
          createdBy: { in: scope.userIds },
          createdAt: { gte: start, lte: end },
        },
      }),
      prisma.proposal.groupBy({
        by: ["createdBy"],
        _count: { _all: true },
        where: {
          createdBy: { in: scope.userIds },
          createdAt: { gte: start, lte: end },
        },
      }),
      prisma.proposal.groupBy({
        by: ["createdBy"],
        _count: { _all: true },
        where: {
          createdBy: { in: scope.userIds },
          createdAt: { gte: start, lte: end },
          stage: "assinatura",
        },
      }),
    ]);

    const leadsByUserMap = new Map(
      leadsByUser.map((r) => [r.createdBy || "", r._count._all])
    );
    const propsByUserMap = new Map(
      propsByUser.map((r) => [r.createdBy || "", r._count._all])
    );
    const signedByUserMap = new Map(
      signedByUserCount.map((r) => [r.createdBy || "", r._count._all])
    );

    const consultantsSummary = consultantsInScope
      .map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        leads: leadsByUserMap.get(u.id) || 0,
        proposals: propsByUserMap.get(u.id) || 0,
        signed: signedByUserMap.get(u.id) || 0,
        position: u.position,
      }))
      .sort(
        (a, b) =>
          b.signed - a.signed || b.proposals - a.proposals || b.leads - a.leads
      );

    // === Conversão ===
    const signedContracts = signedProposals.length;
    const conversionRate =
      totalLeads > 0 ? (signedContracts / totalLeads) * 100 : 0;

    // === Resposta ===
    return NextResponse.json({
      ok: true,
      data: {
        me: {
          id: me.id,
          name: me.name,
          email: me.email,
          position: me.position,
        },
        period: { start, end },
        totals: {
          totalLeads,
          totalProposals,
          signedContracts,
          totalSignedValue,
          conversionRate,
        },
        leadsByStatus: leadsByStatusRaw.map((r) => ({
          status: r.status,
          count: r._count.status,
          label: LEAD_STATUS_LABELS[r.status] || r.status,
        })),
        proposalsByStage: proposalsByStageRaw.map((r) => ({
          stage: r.stage,
          count: r._count.stage,
          label: PROPOSAL_STAGE_LABELS[r.stage] || r.stage,
        })),
        evolution,
        topSellers,
        managersBreakdown,
        consultantsSummary,
      },
    });
  } catch (error: any) {
    console.error("Erro ao buscar dados da hierarquia:", error);
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "Erro ao buscar dados da hierarquia",
      },
      { status: 500 }
    );
  }
}
