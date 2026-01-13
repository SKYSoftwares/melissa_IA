const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixLeadsStatus() {
  try {
    console.log('🔧 Corrigindo status dos leads...\n');
    
    // Mapeamento de status antigos para novos
    const statusMapping = {
      'contato_feito': 'primeiro_contato',
      'proposta_enviada': 'proposta',
      'reagendado': 'agendamento',
      'fechado': 'negociacao',
      'perdido': 'lixeira',
      'aguardando_retorno': 'primeiro_contato'
    };
    
    console.log('📋 Mapeamento de status:');
    Object.entries(statusMapping).forEach(([oldStatus, newStatus]) => {
      console.log(`   ${oldStatus} → ${newStatus}`);
    });
    
    // Buscar todos os leads da gerente
    const leads = await prisma.lead.findMany({
      where: {
        OR: [
          { createdBy: 'cmdajdw4v000fv4i4hx8qrgb4' }, // ID da gerente
          {
            createdBy: {
              in: await prisma.team.findMany({
                where: {
                  teamId: {
                    in: await prisma.teamGroup.findMany({
                      where: {
                        managerId: 'cmdajdw4v000fv4i4hx8qrgb4' // ID da gerente
                      },
                      select: { id: true }
                    }).then(groups => groups.map(g => g.id))
                  }
                },
                select: { id: true }
              }).then(members => members.map(m => m.id))
            }
          }
        ]
      },
      select: {
        id: true,
        name: true,
        status: true
      }
    });
    
    console.log(`\n📊 Total de leads encontrados: ${leads.length}`);
    
    // Contar leads que precisam ser atualizados
    const leadsToUpdate = leads.filter(lead => 
      lead.status && statusMapping[lead.status]
    );
    
    console.log(`🔧 Leads que precisam ser atualizados: ${leadsToUpdate.length}`);
    
    if (leadsToUpdate.length === 0) {
      console.log('✅ Todos os leads já têm status válido!');
      return;
    }
    
    // Atualizar os leads
    let updatedCount = 0;
    for (const lead of leadsToUpdate) {
      const newStatus = statusMapping[lead.status];
      console.log(`   Atualizando ${lead.name}: ${lead.status} → ${newStatus}`);
      
      await prisma.lead.update({
        where: { id: lead.id },
        data: { status: newStatus }
      });
      
      updatedCount++;
    }
    
    console.log(`\n✅ ${updatedCount} leads atualizados com sucesso!`);
    
    // Verificar resultado final
    const updatedLeads = await prisma.lead.findMany({
      where: {
        OR: [
          { createdBy: 'cmdajdw4v000fv4i4hx8qrgb4' },
          {
            createdBy: {
              in: await prisma.team.findMany({
                where: {
                  teamId: {
                    in: await prisma.teamGroup.findMany({
                      where: {
                        managerId: 'cmdajdw4v000fv4i4hx8qrgb4'
                      },
                      select: { id: true }
                    }).then(groups => groups.map(g => g.id))
                  }
                },
                select: { id: true }
              }).then(members => members.map(m => m.id))
            }
          }
        ]
      },
      select: {
        id: true,
        name: true,
        status: true
      }
    });
    
    // Agrupar por status final
    const finalStatusCount = {};
    updatedLeads.forEach(lead => {
      const status = lead.status || 'novos_leads';
      finalStatusCount[status] = (finalStatusCount[status] || 0) + 1;
    });
    
    console.log('\n📊 Distribuição final por status:');
    Object.entries(finalStatusCount).forEach(([status, count]) => {
      console.log(`   ${status}: ${count} leads`);
    });
    
    const pipelineStatuses = [
      'novos_leads',
      'primeiro_contato', 
      'agendamento',
      'reuniao',
      'negociacao',
      'proposta',
      'lixeira'
    ];
    
    const validLeads = updatedLeads.filter(lead => 
      !lead.status || pipelineStatuses.includes(lead.status)
    );
    
    console.log(`\n✅ Leads com status válido: ${validLeads.length}/${updatedLeads.length}`);
    
    if (validLeads.length === updatedLeads.length) {
      console.log('🎉 Todos os leads agora têm status válido!');
    } else {
      console.log('⚠️  Ainda há leads com status inválido');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixLeadsStatus(); 