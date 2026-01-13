import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

const prisma = new PrismaClient();

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const {
      leadId,
      name,
      email,
      phone,
      ocupation,
      potentialValue,
      observations,
      status,
      product,
    } = await request.json();

    if (!leadId) {
      return NextResponse.json(
        { error: "ID do lead é obrigatório" },
        { status: 400 }
      );
    }

    // Verificar se o lead existe e não está deletado
    const existingLead = await prisma.lead.findFirst({
      where: { 
        id: leadId,
        deletedAt: null,
      },
      include: { creator: true },
    });

    if (!existingLead) {
      return NextResponse.json(
        { error: "Lead não encontrado ou está na lixeira" },
        { status: 404 }
      );
    }

    // Verificar permissão (criador do lead ou admin)
    const user = await prisma.team.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    // Preparar dados para atualização
    const updateData: any = {
      name: name || existingLead.name,
      email: email || existingLead.email,
      phone: phone || existingLead.phone,
      ocupation: ocupation || existingLead.ocupation,
      potentialValue: potentialValue || existingLead.potentialValue,
      observations: observations || existingLead.observations,
      status: status || existingLead.status,
      product: product || existingLead.product,
      updatedAt: new Date(),
    };

    // Atualizar o lead
    const updatedLead = await prisma.lead.update({
      where: { id: leadId },
      data: updateData,
      include: {
        creator: true,
        proposals: true,
        followups: true,
        meetings: true,
        files: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Lead atualizado com sucesso!",
      lead: updatedLead,
    });
  } catch (error) {
    console.error("Error updating lead:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
