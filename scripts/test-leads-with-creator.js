const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testLeadsWithCreator() {
  try {
    console.log('🔍 Testando leads com informações do consultor responsável...\n');
    
    // Buscar leads da gerente com informações do criador
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
      include: {
        creator: {
          select: {
            name: true,
            email: true,
            position: true
          }
        }
      },
      take: 10 // Apenas os primeiros 10 para teste
    });
    
    console.log(`📊 Total de leads encontrados: ${leads.length}\n`);
    
    console.log('📋 Amostra de leads com consultor responsável:');
    leads.forEach((lead, index) => {
      console.log(`\n${index + 1}. ${lead.name}`);
      console.log(`   Status: ${lead.status}`);
      console.log(`   Valor: ${lead.potentialValue}`);
      console.log(`   Consultor: ${lead.creator?.name || 'N/A'} (${lead.creator?.position || 'N/A'})`);
      console.log(`   Email do consultor: ${lead.creator?.email || 'N/A'}`);
    });
    
    // Verificar se todos os leads têm consultor
    const leadsWithCreator = leads.filter(lead => lead.creator);
    const leadsWithoutCreator = leads.filter(lead => !lead.creator);
    
    console.log(`\n📊 Estatísticas:`);
    console.log(`   Leads com consultor: ${leadsWithCreator.length}`);
    console.log(`   Leads sem consultor: ${leadsWithoutCreator.length}`);
    
    if (leadsWithoutCreator.length > 0) {
      console.log(`\n⚠️  Leads sem consultor:`);
      leadsWithoutCreator.forEach(lead => {
        console.log(`   - ${lead.name} (ID: ${lead.id})`);
      });
    }
    
    // Agrupar por consultor
    const leadsByCreator = {};
    leadsWithCreator.forEach(lead => {
      const creatorName = lead.creator.name;
      if (!leadsByCreator[creatorName]) {
        leadsByCreator[creatorName] = [];
      }
      leadsByCreator[creatorName].push(lead);
    });
    
    console.log(`\n📋 Distribuição por consultor:`);
    Object.entries(leadsByCreator).forEach(([creatorName, creatorLeads]) => {
      console.log(`   ${creatorName}: ${creatorLeads.length} leads`);
    });
    
    // Testar a API diretamente
    console.log(`\n🧪 Testando API diretamente...`);
    
    const response = await fetch('http://localhost:3000/api/leads?userEmail=gabrielanascimento17529470031181751141_1%40yahoo.com&userRole=gerente');
    
    if (response.ok) {
      const apiLeads = await response.json();
      console.log(`✅ API retornou ${apiLeads.length} leads`);
      
      if (apiLeads.length > 0) {
        console.log(`\n📋 Primeiro lead da API:`);
        const firstLead = apiLeads[0];
        console.log(`   Nome: ${firstLead.name}`);
        console.log(`   Status: ${firstLead.status}`);
        console.log(`   Consultor: ${firstLead.creator?.name || 'N/A'}`);
        console.log(`   Email do consultor: ${firstLead.creator?.email || 'N/A'}`);
        console.log(`   Cargo do consultor: ${firstLead.creator?.position || 'N/A'}`);
      }
    } else {
      console.log(`❌ Erro na API: ${response.status}`);
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testLeadsWithCreator(); 