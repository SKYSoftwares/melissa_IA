import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get('userEmail');
    const userRole = searchParams.get('userRole');

    // Determinar quais usuários o usuário atual pode ver
    let userFilter: any = {};
    
    if (userRole === 'administrador') {
      // Administrador vê todos os dados
    } else if (userRole === 'diretor') {
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
      const user = await prisma.team.findUnique({
        where: { email: userEmail || '' },
        select: { id: true }
      });
      if (user) {
        userFilter.createdBy = user.id;
      }
    }

    // Gerar dados dos últimos 6 meses
    const months = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = date.toLocaleDateString('pt-BR', { month: 'short' });
      
      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      // Contar leads do mês
      const leadsCount = await prisma.lead.count({
        where: {
          ...userFilter,
          createdAt: {
            gte: startOfMonth,
            lte: endOfMonth
          }
        }
      });

      // Contar propostas do mês
      const proposalsCount = await prisma.proposal.count({
        where: {
          ...userFilter,
          createdAt: {
            gte: startOfMonth,
            lte: endOfMonth
          }
        }
      });

      // Calcular valor total dos CONTRATOS ASSINADOS do mês (vendas realizadas)
      const signedContractsWithValues = await prisma.proposal.findMany({
        where: {
          ...userFilter,
          createdAt: {
            gte: startOfMonth,
            lte: endOfMonth
          },
          value: { not: '' },
          stage: 'assinatura' // Apenas propostas na fase de contrato assinado = vendas realizadas
        },
        select: { value: true }
      });

      const totalValue = signedContractsWithValues.reduce((sum, proposal) => {
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

      // Calcular taxa de conversão do mês (baseada em contratos assinados)
      const signedContractsCount = await prisma.proposal.count({
        where: {
          ...userFilter,
          createdAt: {
            gte: startOfMonth,
            lte: endOfMonth
          },
          stage: 'assinatura' // Apenas propostas na fase de contrato assinado
        }
      });
      
      const conversionRate = leadsCount > 0 ? (signedContractsCount / leadsCount * 100) : 0;

      months.push({
        month: monthName,
        leads: leadsCount,
        proposals: proposalsCount,
        value: totalValue,
        conversion: conversionRate
      });
    }

    return NextResponse.json({ months });

  } catch (error) {
    console.error('Erro ao buscar evolução temporal:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
} 