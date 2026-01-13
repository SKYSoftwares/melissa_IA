// lib/dashboardScope.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type Position = "administrador" | "diretor" | "gerente" | "consultor";

export async function getTeamByEmail(email: string) {
  return prisma.team.findUnique({ where: { email } });
}

export function brlToNumber(value?: string | null): number {
  if (!value) return 0;
  return (
    Number(
      value
        .replace(/[^\d,.-]/g, "") // mantém dígitos, vírgula, ponto, sinal
        .replace(/\.(?=\d{3}(\D|$))/g, "") // remove pontos de milhar
        .replace(",", ".") // vírgula -> ponto decimal
    ) || 0
  );
}

export function getPeriodRange(period: string) {
  const now = new Date();
  const start = new Date();

  switch (period) {
    case "hoje":
      start.setHours(0, 0, 0, 0);
      break;
    case "semana": {
      const day = now.getDay(); // 0-dom
      const diff = (day + 6) % 7; // segunda como início
      start.setDate(now.getDate() - diff);
      start.setHours(0, 0, 0, 0);
      break;
    }
    case "mes":
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      break;
    case "trimestre": {
      const month = now.getMonth();
      const firstQuarterMonth = Math.floor(month / 3) * 3; // 0,3,6,9
      start.setMonth(firstQuarterMonth, 1);
      start.setHours(0, 0, 0, 0);
      break;
    }
    case "ano":
      start.setMonth(0, 1);
      start.setHours(0, 0, 0, 0);
      break;
    default:
      start.setMonth(0, 1);
      start.setHours(0, 0, 0, 0);
  }

  return { start, end: now };
}

export async function resolveAccessibleUserIds(me: {
  id: string;
  position: string | null;
}): Promise<{
  position: Position;
  userIds: string[];
  managerIds: string[];
}> {
  const position = (me.position as Position) || "Consultor";
  console.log(position, "POSITION");

  if (position.toLowerCase() === "administrador") {
    console.log("ADMIN");
    const all = await prisma.team.findMany({ select: { id: true } });
    return { position, userIds: all.map((u) => u.id), managerIds: [] };
  }

  if (position.toLowerCase() === "diretor") {
    const managers = await prisma.team.findMany({
      where: { position: "Gerente", directorId: me.id },
      select: { id: true },
    });

    const groups = await prisma.teamGroup.findMany({
      where: { managerId: { in: managers.map((m) => m.id) } },
      include: { members: { select: { id: true } } },
    });

    const consultantIds = groups.flatMap((g) => g.members.map((m) => m.id));

    return {
      position,
      userIds: [me.id, ...managers.map((m) => m.id), ...consultantIds],
      managerIds: managers.map((m) => m.id),
    };
  }

  if (position.toLowerCase() === "gerente") {
    const groups = await prisma.teamGroup.findMany({
      where: { managerId: me.id },
      include: { members: { select: { id: true } } },
    });
    const memberIds = groups.flatMap((g) => g.members.map((m) => m.id));
    return { position, userIds: [me.id, ...memberIds], managerIds: [me.id] };
  }

  // Consultor
  return { position, userIds: [me.id], managerIds: [] };
}

export const PROPOSAL_STAGE_LABELS: Record<string, string> = {
  pendente_envio: "Proposta Enviada",
  proposta: "Análise de Crédito",
  negociacao: "Jurídico",
  aprovacao: "Vistoria",
  documentacao: "Aprovação",
  assinatura: "Contrato Assinado",
  fechado: "Cancelado",
};

export const LEAD_STATUS_LABELS: Record<string, string> = {
  novos_leads: "Novos Leads",
  em_contato: "Em Contato",
  qualificados: "Qualificados",
  proposta: "Proposta",
  negociacao: "Negociação",
  aprovacao: "Aprovação",
  assinatura: "Contrato Assinado",
  cancelado: "Cancelado",
};
