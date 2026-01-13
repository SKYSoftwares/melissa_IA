import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const followups = await prisma.followup.findMany({
      where: { leadId: id },
      orderBy: { date: "desc" },
    });
    return NextResponse.json(Array.isArray(followups) ? followups : []);
  } catch (error) {
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, followUp } = body;

    // Validações básicas
    if (!id || !followUp) {
      return NextResponse.json(
        { error: "ID e followUp são obrigatórios" },
        { status: 400 }
      );
    }
    // Se veio followUp, salva na tabela

    try {
      return await prisma.followup.create({
        data: {
          observations: followUp.observations || followUp.observation,
          tipeOfContact: followUp.tipeOfContact || followUp.type,
          date: new Date(followUp.date),
          dateNextContact: followUp.dateNextContact
            ? new Date(followUp.dateNextContact)
            : new Date(),
          leadId: id,
        },
      });
    } catch (err) {
      console.error("Erro ao criar followup:", err);
    }

    return NextResponse.json(followUp);
  } catch (error: any) {
    console.error("Erro ao atualizar lead:", error);

    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Lead não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
