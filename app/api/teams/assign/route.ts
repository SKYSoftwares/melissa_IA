import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Alocar/desalocar consultor em equipe
export async function PUT(req: NextRequest) {
  try {
    const { consultantId, teamId } = await req.json();
    if (!consultantId) {
      return NextResponse.json({ error: "Consultor obrigatório." }, { status: 400 });
    }
    // Só consultores podem ser alocados
    const consultant = await prisma.team.findUnique({ where: { id: consultantId } });
    if (!consultant || consultant.position.toLowerCase() !== "consultor") {
      return NextResponse.json({ error: "Apenas consultores podem ser alocados." }, { status: 400 });
    }
    // Atualizar teamId do consultor
    const updated = await prisma.team.update({
      where: { id: consultantId },
      data: { teamId: teamId ? teamId : null },
    });
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: "Erro ao alocar consultor", details: String(error) }, { status: 500 });
  }
} 