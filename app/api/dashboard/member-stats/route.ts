import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const memberEmail = searchParams.get('memberEmail');
    const period = searchParams.get('period') || 'mes';

    if (!memberEmail) {
      return NextResponse.json({ error: 'Email do membro é obrigatório' }, { status: 400 });
    }

    // Calcular datas baseadas no período
    const now = new Date();
    let startDate: Date;
    
    switch (period) {
      case 'hoje':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'semana':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'mes':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'trimestre':
        startDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
        break;
      case 'ano':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    // Buscar o ID do membro pelo email
    const member = await prisma.team.findUnique({
      where: { email: memberEmail },
      select: { id: true, name: true, email: true, position: true }
    });

    if (!member) {
      return NextResponse.json({ error: 'Membro não encontrado' }, { status: 404 });
    }

    // 1. Total de Leads
    const totalLeads = await prisma.lead.count({
      where: {
        createdBy: member.id,
        createdAt: { gte: startDate }
      }
    });

    // 2. Total de Propostas
    const totalProposals = await prisma.proposal.count({
      where: {
        createdBy: member.id,
        createdAt: { gte: startDate }
      }
    });

    // 3. Contratos Assinados
    const signedContracts = await prisma.proposal.count({
      where: {
        createdBy: member.id,
        createdAt: { gte: startDate },
        stage: 'assinatura'
      }
    });

    // 4. Taxa de Conversão
    const conversionRate = totalLeads > 0 ? (signedContracts / totalLeads * 100) : 0;

    // 5. Total de Vendas (valor dos contratos assinados)
    const signedContractsWithValues = await prisma.proposal.findMany({
      where: {
        createdBy: member.id,
        createdAt: { gte: startDate },
        value: { not: '' },
        stage: 'assinatura'
      },
      select: { value: true }
    });

    const totalSales = signedContractsWithValues.reduce((sum, proposal) => {
      // Tratar diferentes formatos de valor
      let value = 0;
      if (proposal.value) {
        // Se o valor já é um número (sem formatação)
        if (/^\d+$/.test(proposal.value)) {
          value = parseFloat(proposal.value);
        } else {
          // Se tem formatação (R$, vírgulas, etc.)
          value = parseFloat(proposal.value.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
        }
      }
      return sum + value;
    }, 0);

    // 6. Propostas por estágio
    const proposalsByStage = await prisma.proposal.groupBy({
      by: ['stage'],
      where: {
        createdBy: member.id,
        createdAt: { gte: startDate }
      },
      _count: { stage: true }
    });

    // 7. Leads por status
    const leadsByStatus = await prisma.lead.groupBy({
      by: ['status'],
      where: {
        createdBy: member.id,
        createdAt: { gte: startDate }
      },
      _count: { status: true }
    });

    return NextResponse.json({
      member: {
        id: member.id,
        name: member.name,
        email: member.email,
        position: member.position
      },
      stats: {
        totalLeads,
        totalProposals,
        signedContracts,
        conversionRate,
        totalSales,
        proposalsByStage,
        leadsByStatus,
        period,
        startDate: startDate.toISOString(),
        endDate: now.toISOString()
      }
    });

  } catch (error) {
    console.error('Erro ao buscar estatísticas do membro:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
} 