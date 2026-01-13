import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// Buscar simulações
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const leadId = searchParams.get('leadId');
    const proposalId = searchParams.get('proposalId');
    
    let whereClause: any = {};
    
    if (leadId) {
      whereClause.leadId = leadId;
    }
    
    if (proposalId) {
      whereClause.proposalId = proposalId;
    }
    
    const simulations = await prisma.simulation.findMany({
      where: whereClause,
      include: {
        lead: true,
        proposal: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    return NextResponse.json(simulations);
  } catch (error) {
    return NextResponse.json({ error: "Erro ao buscar simulações", details: String(error) }, { status: 500 });
  }
}

// Criar simulação
export async function POST(req: NextRequest) {
  try {
    const {
      creditoUnitario,
      taxa,
      prazoConsorcio,
      opcaoParcela,
      parcelaContemplacao,
      mesContemplacao,
      acrescentarSeguro,
      leadId,
      proposalId
    } = await req.json();
    
    if (!creditoUnitario || !taxa || !prazoConsorcio || !opcaoParcela) {
      return NextResponse.json({ error: "Campos obrigatórios não preenchidos" }, { status: 400 });
    }
    
    // Verificar se o lead existe (se fornecido)
    if (leadId) {
      const lead = await prisma.lead.findFirst({
        where: { 
          id: leadId,
          deletedAt: null, // Não permitir criar simulação para lead deletado
        }
      });
      
      if (!lead) {
        return NextResponse.json({ error: "Lead não encontrado ou está na lixeira" }, { status: 404 });
      }
    }
    
    // Verificar se a proposta existe (se fornecida)
    if (proposalId) {
      const proposal = await prisma.proposal.findUnique({
        where: { id: proposalId }
      });
      
      if (!proposal) {
        return NextResponse.json({ error: "Proposta não encontrada" }, { status: 404 });
      }
    }
    
    const simulation = await prisma.simulation.create({
      data: {
        creditoUnitario: Number(creditoUnitario),
        taxa: Number(taxa),
        prazoConsorcio: Number(prazoConsorcio),
        opcaoParcela,
        parcelaContemplacao: parcelaContemplacao ? Number(parcelaContemplacao) : null,
        mesContemplacao: mesContemplacao ? Number(mesContemplacao) : null,
        acrescentarSeguro: Boolean(acrescentarSeguro),
        leadId: leadId || null,
        proposalId: proposalId || null,
      },
      include: {
        lead: true,
        proposal: true,
      }
    });
    
    return NextResponse.json(simulation, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao criar simulação", details: String(error) }, { status: 500 });
  }
}

// Atualizar simulação
export async function PUT(req: NextRequest) {
  try {
    const { id, ...data } = await req.json();
    
    if (!id) {
      return NextResponse.json({ error: "ID da simulação é obrigatório" }, { status: 400 });
    }
    
    const simulation = await prisma.simulation.update({
      where: { id },
      data: {
        ...data,
        creditoUnitario: data.creditoUnitario ? Number(data.creditoUnitario) : undefined,
        taxa: data.taxa ? Number(data.taxa) : undefined,
        prazoConsorcio: data.prazoConsorcio ? Number(data.prazoConsorcio) : undefined,
        parcelaContemplacao: data.parcelaContemplacao ? Number(data.parcelaContemplacao) : null,
        mesContemplacao: data.mesContemplacao ? Number(data.mesContemplacao) : null,
        acrescentarSeguro: data.acrescentarSeguro !== undefined ? Boolean(data.acrescentarSeguro) : undefined,
      },
      include: {
        lead: true,
        proposal: true,
      }
    });
    
    return NextResponse.json(simulation);
  } catch (error) {
    return NextResponse.json({ error: "Erro ao atualizar simulação", details: String(error) }, { status: 500 });
  }
}

// Deletar simulação
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: "ID da simulação é obrigatório" }, { status: 400 });
    }
    
    await prisma.simulation.delete({
      where: { id }
    });
    
    return NextResponse.json({ message: "Simulação deletada com sucesso" });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao deletar simulação", details: String(error) }, { status: 500 });
  }
} 