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
      proposalId,
      title,
      client,
      company,
      value,
      stage,
      priority,
      dueDate,
      description,
      phone,
      email,
      // Dados de simulação
      creditoUnitario,
      taxa,
      prazoConsorcio,
      opcaoParcela,
      parcelaContemplacao,
      mesContemplacao,
      acrescentarSeguro,
    } = await request.json();

    if (!proposalId) {
      return NextResponse.json(
        { error: "ID da proposta é obrigatório" },
        { status: 400 }
      );
    }

    // Verificar se a proposta existe e se o usuário tem permissão
    const existingProposal = await prisma.proposal.findUnique({
      where: { id: proposalId },
      include: { creator: true },
    });

    if (!existingProposal) {
      return NextResponse.json(
        { error: "Proposta não encontrada" },
        { status: 404 }
      );
    }

    // Verificar permissão (criador da proposta ou admin)
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
      title: title || existingProposal.title,
      client: client || existingProposal.client,
      company: company || existingProposal.company,
      value: value || existingProposal.value,
      stage: stage || existingProposal.stage,
      priority: priority || existingProposal.priority,
      dueDate: dueDate || existingProposal.dueDate,
      description: description || existingProposal.description,
      phone: phone || existingProposal.phone,
      email: email || existingProposal.email,
      updatedAt: new Date(),
    };

    // Adicionar dados de simulação se fornecidos
    if (creditoUnitario !== undefined)
      updateData.creditoUnitario = creditoUnitario;
    if (taxa !== undefined) updateData.taxa = taxa;
    if (prazoConsorcio !== undefined)
      updateData.prazoConsorcio = prazoConsorcio;
    if (opcaoParcela !== undefined) updateData.opcaoParcela = opcaoParcela;
    if (parcelaContemplacao !== undefined)
      updateData.parcelaContemplacao = parcelaContemplacao;
    if (mesContemplacao !== undefined)
      updateData.mesContemplacao = mesContemplacao;
    if (acrescentarSeguro !== undefined)
      updateData.acrescentarSeguro = acrescentarSeguro;

    // Atualizar a proposta
    const updatedProposal = await prisma.proposal.update({
      where: { id: proposalId },
      data: updateData,
      include: {
        lead: true,
        creator: true,
        proponentes: true,
        imoveis: true,
        arquivos: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Proposta atualizada com sucesso!",
      proposal: updatedProposal,
    });
  } catch (error) {
    console.error("Error updating proposal:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
