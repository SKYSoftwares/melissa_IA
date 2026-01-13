import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Criar equipe
export async function POST(req: NextRequest) {
  try {
    const { name, managerId } = await req.json();
    if (!name || !managerId) {
      return NextResponse.json(
        { error: "Nome e gerente são obrigatórios." },
        { status: 400 }
      );
    }
    const team = await prisma.teamGroup.create({
      data: {
        name,
        managerId,
      },
      include: {
        manager: true,
        members: true,
      },
    });
    return NextResponse.json(team, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao criar equipe", details: String(error) },
      { status: 500 }
    );
  }
}

// Listar equipes respeitando hierarquia
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId"); // 👈 deve vir do frontend/session

    if (!userId) {
      return NextResponse.json(
        { error: "Usuário não autenticado" },
        { status: 401 }
      );
    }

    const user = await prisma.team.findUnique({
      where: { id: userId },
      include: { permissions: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    let teams: any[];

    // 🔹 Admin → vê todos os times
    if (user.position === "administrador") {
      teams = await prisma.teamGroup.findMany({
        include: {
          manager: true,
          members: true,
        },
        orderBy: { name: "asc" },
      });
    }
    // 🔹 Diretor → vê apenas times de seus gerentes
    else if (user.position === "Diretor") {
      teams = await prisma.teamGroup.findMany({
        where: {
          manager: {
            directorId: user.id,
          },
        },
        include: {
          manager: true,
          members: true,
        },
        orderBy: { name: "asc" },
      });
    }
    // 🔹 Gerente → vê apenas o time que ele gerencia
    else if (user.position === "Gerente") {
      teams = await prisma.teamGroup.findMany({
        where: { managerId: user.id },
        include: {
          manager: true,
          members: true,
        },
        orderBy: { name: "asc" },
      });
    } else {
      // Consultores não devem ver nada
      teams = [];
    }
    // Remover duplicatas baseado no ID do team
    const uniqueTeams = teams.reduce((acc: any[], current: any) => {
      const exists = acc.find((team) => team.id === current.id);
      if (!exists) {
        acc.push(current);
      }
      return acc;
    }, []);

    teams = uniqueTeams;

    return NextResponse.json(teams);
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao buscar equipes", details: String(error) },
      { status: 500 }
    );
  }
}
