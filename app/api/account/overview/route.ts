// app/api/account/overview/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Retorna um resumo do usuário (Team) e métricas no seu escopo:
 * - managers: total de gerentes sob o usuário (ou todos, se admin; ou 1 no caso do próprio gerente)
 * - consultants: consultores dentro dos grupos geridos pelos managers do escopo
 * - teams: quantidade de TeamGroup no escopo
 * - users: soma dos usuários no escopo (ver regra por função)
 * - since: data mais antiga (createdAt) entre os TeamGroup do escopo
 *
 * Respeita hierarquia:
 * - administrador -> todo mundo
 * - Diretor -> times dos gerentes cujo directorId = me.id
 * - Gerente -> somente os times que gerencia
 * - Consultor -> sem times/contagem (apenas ele mesmo)
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    if (!userId) {
      return NextResponse.json(
        { error: "Usuário não autenticado" },
        { status: 401 }
      );
    }

    const me = await prisma.team.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        position: true,
        avatarUrl: true,
      },
    });

    if (!me) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    const pos = (me.position || "").toLowerCase();
    console.log(
      `API overview called for user ${me.name} (${me.id}) with position: ${me.position} -> ${pos}`
    );

    // --- Descobrir managers no escopo
    let managerIds: string[] = [];
    if (pos === "administrador") {
      const mgrs = await prisma.team.findMany({
        where: { position: { in: ["Gerente", "gerente"] } },
        select: { id: true },
      });
      managerIds = mgrs.map((m) => m.id);
    } else if (pos === "diretor") {
      console.log(`Looking for managers with directorId: ${me.id}`);
      const mgrs = await prisma.team.findMany({
        where: {
          position: { in: ["Gerente", "gerente"] },
          directorId: me.id,
        },
        select: { id: true, name: true, position: true },
      });
      console.log(
        `Found ${mgrs.length} managers for director ${me.name}:`,
        mgrs
      );

      // Se não encontrou gerentes, pode ser que o diretor gerencie equipes diretamente
      if (mgrs.length === 0) {
        console.log(
          `No managers found, checking if director manages teams directly`
        );
        managerIds = [me.id]; // Incluir o próprio diretor como manager
      } else {
        managerIds = mgrs.map((m) => m.id);
      }
    } else if (pos === "gerente") {
      managerIds = [me.id];
    } else {
      managerIds = []; // consultor
    }

    // --- TeamGroups no escopo
    console.log(`Looking for TeamGroups with managerIds:`, managerIds);
    const groups =
      pos === "administrador"
        ? await prisma.teamGroup.findMany({
            include: { members: { select: { id: true } } },
            orderBy: { createdAt: "asc" },
          })
        : await prisma.teamGroup.findMany({
            where: { managerId: { in: managerIds } },
            include: { members: { select: { id: true } } },
            orderBy: { createdAt: "asc" },
          });

    console.log(
      `Found ${groups.length} TeamGroups:`,
      groups.map((g) => ({
        id: g.id,
        name: g.name,
        managerId: g.managerId,
        membersCount: g.members?.length || 0,
      }))
    );

    const teamsCount = groups.length;
    const consultantsInScope = groups.reduce(
      (acc, g) => acc + (g.members?.length || 0),
      0
    );

    const managersCount =
      pos === "administrador"
        ? managerIds.length
        : pos === "gerente"
        ? 1
        : managerIds.length;

    const consultantsCount = consultantsInScope;

    const usersCount =
      pos === "administrador"
        ? await prisma.team.count()
        : pos === "gerente"
        ? 1 + consultantsCount // o próprio gerente + consultores dele
        : managersCount + consultantsCount; // diretor: seus gerentes + consultores

    const since = groups[0]?.createdAt ?? null;

    console.log(`Stats for ${me.name}:`, {
      managersCount,
      consultantsCount,
      teamsCount,
      usersCount,
      groupsFound: groups.length,
      consultantsInScope,
      calculation: `${managersCount} + ${consultantsCount} = ${managersCount + consultantsCount}`
    });

    return NextResponse.json({
      id: me.id,
      name: me.name,
      email: me.email,
      position: me.position, // <- usar isso no front (não o role da session)
      avatarUrl: me.avatarUrl,
      since,
      stats: {
        managers: managersCount,
        consultants: consultantsCount,
        teams: teamsCount,
        users: usersCount,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao buscar overview", details: String(error) },
      { status: 500 }
    );
  }
}
