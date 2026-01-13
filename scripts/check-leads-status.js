const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkLeadsStatus() {
  try {
    console.log('🔍 Verificando status dos leads no banco de dados...\n');
    
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
        status: true,
        createdBy: true,
        createdAt: true
      }
    });
    
    console.log(`📊 Total de leads encontrados: ${leads.length}\n`);
    
    // Agrupar por status
    const statusCount = {};
    leads.forEach(lead => {
      const status = lead.status || 'novos_leads';
      statusCount[status] = (statusCount[status] || 0) + 1;
    });
    
    console.log('📋 Distribuição por status:');
    Object.entries(statusCount).forEach(([status, count]) => {
      console.log(`   ${status}: ${count} leads`);
    });
    
    console.log('\n📋 Status possíveis no pipeline:');
    const pipelineStatuses = [
      'novos_leads',
      'primeiro_contato', 
      'agendamento',
      'reuniao',
      'negociacao',
      'proposta',
      'lixeira'
    ];
    
    pipelineStatuses.forEach(status => {
      const count = statusCount[status] || 0;
      console.log(`   ${status}: ${count} leads`);
    });
    
    // Verificar leads sem status
    const leadsWithoutStatus = leads.filter(lead => !lead.status);
    if (leadsWithoutStatus.length > 0) {
      console.log(`\n⚠️  Leads sem status (${leadsWithoutStatus.length}):`);
      leadsWithoutStatus.forEach(lead => {
        console.log(`   - ${lead.name} (ID: ${lead.id})`);
      });
    }
    
    // Verificar leads com status inválido
    const leadsWithInvalidStatus = leads.filter(lead => 
      lead.status && !pipelineStatuses.includes(lead.status)
    );
    
    if (leadsWithInvalidStatus.length > 0) {
      console.log(`\n❌ Leads com status inválido (${leadsWithInvalidStatus.length}):`);
      leadsWithInvalidStatus.forEach(lead => {
        console.log(`   - ${lead.name}: "${lead.status}"`);
      });
    }
    
    // Verificar se todos os leads têm status válido
    const validLeads = leads.filter(lead => 
      !lead.status || pipelineStatuses.includes(lead.status)
    );
    
    console.log(`\n✅ Leads com status válido: ${validLeads.length}/${leads.length}`);
    
    if (validLeads.length === leads.length) {
      console.log('🎉 Todos os leads têm status válido!');
    } else {
      console.log('⚠️  Alguns leads têm status inválido ou nulo');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkLeadsStatus(); 