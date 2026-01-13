import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get('userEmail');
    const userRole = searchParams.get('userRole');
    const period = searchParams.get('period') || 'month'; // hoje, semana, mes, trimestre, ano

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

    // Determinar quais usuários o usuário atual pode ver
    let userFilter: any = {};
    
    if (userRole === 'administrador') {
      // Administrador vê todos os dados
    } else if (userRole === 'diretor') {
      // Diretor vê dados dos gerentes que gerencia e dos consultores dessas equipes
      const diretor = await prisma.team.findUnique({
        where: { email: userEmail || '' },
        include: {
          managedTeams: {
            include: {
              members: {
                select: { id: true }
              }
            }
          }
        }
      });
      
      if (diretor && diretor.managedTeams.length > 0) {
        const allIds = diretor.managedTeams.flatMap(gerenteTeam => 
          [gerenteTeam.managerId, ...gerenteTeam.members.map(member => member.id)]
        );
        userFilter.createdBy = { in: allIds };
      }
    } else if (userRole === 'gerente') {
      // Gerente vê dados dos consultores da sua equipe e os próprios
      const gerente = await prisma.team.findUnique({
        where: { email: userEmail || '' },
        include: {
          managedTeams: {
            include: {
              members: {
                select: { id: true }
              }
            }
          }
        }
      });
      
      if (gerente && gerente.managedTeams.length > 0) {
        const memberIds = gerente.managedTeams.flatMap(team => 
          team.members.map(member => member.id)
        );
        memberIds.push(gerente.id);
        userFilter.createdBy = { in: memberIds };
      }
    } else {
      // Consultor vê apenas seus próprios dados
      const user = await prisma.team.findUnique({
        where: { email: userEmail || '' },
        select: { id: true }
      });
      if (user) {
        userFilter.createdBy = user.id;
      }
    }

    // 1. Total de Leads
    const totalLeads = await prisma.lead.count({
      where: {
        ...userFilter,
        createdAt: { gte: startDate }
      }
    });

    // 2. Leads por status
    const leadsByStatus = await prisma.lead.groupBy({
      by: ['status'],
      where: {
        ...userFilter,
        createdAt: { gte: startDate }
      },
      _count: { status: true }
    });

    // 3. Total de Propostas
    const totalProposals = await prisma.proposal.count({
      where: {
        ...userFilter,
        createdAt: { gte: startDate }
      }
    });

    // 4. Propostas por estágio
    const proposalsByStage = await prisma.proposal.groupBy({
      by: ['stage'],
      where: {
        ...userFilter,
        createdAt: { gte: startDate }
      },
      _count: { stage: true }
    });

    // 5. Valor total das propostas
    const proposalsWithValues = await prisma.proposal.findMany({
      where: {
        ...userFilter,
        createdAt: { gte: startDate },
        value: { not: '' }
      },
      select: { value: true }
    });

    const totalValue = proposalsWithValues.reduce((sum, proposal) => {
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

    // 5.1. Valor total dos contratos assinados (mais relevante)
    const signedContractsWithValues = await prisma.proposal.findMany({
      where: {
        ...userFilter,
        createdAt: { gte: startDate },
        value: { not: '' },
        stage: 'assinatura'
      },
      select: { value: true }
    });

    const totalSignedValue = signedContractsWithValues.reduce((sum, proposal) => {
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

    // 6. Top vendedores (por valor de VENDAS REALIZADAS - apenas contratos assinados)
    const signedProposalsWithValues = await prisma.proposal.findMany({
      where: {
        ...userFilter,
        createdAt: { gte: startDate },
        value: { not: '' },
        stage: 'assinatura' // Apenas propostas na fase de contrato assinado = vendas realizadas
      },
      select: {
        createdBy: true,
        value: true
      }
    });

    // Agrupar e calcular totais manualmente das vendas realizadas
    const sellerTotals = signedProposalsWithValues.reduce((acc, proposal) => {
      if (!proposal.createdBy) return acc;
      
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
      
      if (!acc[proposal.createdBy]) {
        acc[proposal.createdBy] = { totalValue: 0, count: 0 };
      }
      
      acc[proposal.createdBy].totalValue += value;
      acc[proposal.createdBy].count += 1;
      
      return acc;
    }, {} as Record<string, { totalValue: number; count: number }>);

    // Ordenar por valor total e pegar top 5
    const topSellerIds = Object.entries(sellerTotals)
      .sort(([, a], [, b]) => b.totalValue - a.totalValue)
      .slice(0, 5)
      .map(([id]) => id);

    // Buscar nomes dos vendedores
    const sellers = await prisma.team.findMany({
      where: { id: { in: topSellerIds } },
      select: { id: true, name: true, email: true }
    });

    const topSellersWithNames = topSellerIds.map(sellerId => {
      const sellerInfo = sellers.find(s => s.id === sellerId);
      const sellerData = sellerTotals[sellerId];
      return {
        name: sellerInfo?.name || 'Usuário não encontrado',
        email: sellerInfo?.email || '',
        totalValue: sellerData.totalValue.toString(),
        proposalCount: sellerData.count // Contagem de contratos assinados (vendas realizadas)
      };
    });

    // 7. Reuniões agendadas
    const totalMeetings = await prisma.meeting.count({
      where: {
        organizerEmail: userEmail || '',
        startDateTime: { gte: startDate }
      }
    });

    // 8. Follow-ups realizados
    const totalFollowups = await prisma.followup.count({
      where: {
        date: { gte: startDate },
        lead: {
          ...userFilter
        }
      }
    });

    // 9. Conversão (contratos assinados / leads)
    const signedContracts = await prisma.proposal.count({
      where: {
        ...userFilter,
        createdAt: { gte: startDate },
        stage: 'assinatura' // Apenas propostas na fase de contrato assinado
      }
    });
    
    const conversionRate = totalLeads > 0 ? (signedContracts / totalLeads * 100) : 0;

    // 10. Produtos mais populares (baseado no campo product dos leads)
    const productsByLead = await prisma.lead.groupBy({
      by: ['product'],
      where: {
        ...userFilter,
        createdAt: { gte: startDate },
        product: { not: '' }
      },
      _count: { product: true }
    });

    return NextResponse.json({
      totalLeads,
      leadsByStatus,
      totalProposals,
      proposalsByStage,
      totalValue,
      totalSignedValue, // Valor dos contratos assinados
      signedContracts, // Contagem de contratos assinados
      topSellers: topSellersWithNames,
      totalMeetings,
      totalFollowups,
      conversionRate,
      productsByLead,
      period,
      startDate: startDate.toISOString(),
      endDate: now.toISOString()
    });

  } catch (error) {
    console.error('Erro ao buscar estatísticas do dashboard:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
} 