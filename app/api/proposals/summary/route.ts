// app/api/proposals/summary/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import {
  getTeamByEmail,
  resolveAccessibleUserIds,
  brlToNumber,
} from "@/lib/dashboardScope";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    // 1. Recupera sessão do usuário logado
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { ok: false, error: "Não autenticado" },
        { status: 401 }
      );
    }

    // 2. Recupera usuário no banco
    const me = await getTeamByEmail(session.user.email);
    if (!me) {
      return NextResponse.json(
        { ok: false, error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    // 3. Resolve IDs acessíveis pela hierarquia
    const { userIds } = await resolveAccessibleUserIds(me);

    // 4. Busca apenas propostas desses usuários
    const proposals = await prisma.proposal.findMany({
      where: { createdBy: { in: userIds } },
      select: { stage: true, value: true },
    });

    // 5. Calcula totais
    const totals = {
      negociacao: 0,
      canceladas: 0,
      processo: 0,
      assinadas: 0,
    };

    proposals.forEach((p) => {
      const numericValue = brlToNumber(p.value);

      switch (p.stage) {
        case "pendente_envio":
          totals.negociacao += numericValue;
          break;
        case "fechado":
          totals.canceladas += numericValue;
          break;
        case "documentacao":
        case "aprovacao":
          totals.processo += numericValue;
          break;
        case "assinatura":
          totals.assinadas += numericValue;
          break;
      }
    });

    return NextResponse.json({ ok: true, totals });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, error: "Erro ao calcular totais" },
      { status: 500 }
    );
  }
}
