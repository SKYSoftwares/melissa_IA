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

// Listar equipes (com gerente e membros)
export async function GET() {
  try {
    const teams = await prisma.teamGroup.findMany({
      include: {
        manager: true, // Incluir informações do gerente (incluindo directorId)
        members: true,
      },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(teams);
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao buscar equipes", details: String(error) },
      { status: 500 }
    );
  }
}
