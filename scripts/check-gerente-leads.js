const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkGerenteLeads() {
  try {
    console.log('🔍 Verificando leads dos consultores da Gerente 1 - Gabriela Nascimento\n');
    
    // Buscar a gerente
    const gerente = await prisma.team.findFirst({
      where: {
        name: 'Gerente 1 - Gabriela Nascimento'
      },
      include: {
        managedTeams: {
          include: {
            members: {
              include: {
                leads: true // Incluir leads de cada consultor
              }
            }
          }
        }
      }
    });
    
    if (!gerente) {
      console.log('❌ Gerente não encontrada');
      return;
    }
    
    console.log(`👨‍💼 Gerente: ${gerente.name}`);
    console.log(`📧 Email: ${gerente.email}`);
    console.log(`🆔 ID: ${gerente.id}\n`);
    
    // Verificar equipe
    if (gerente.managedTeams && gerente.managedTeams.length > 0) {
      const equipe = gerente.managedTeams[0];
      console.log(`🏢 Equipe: ${equipe.name}`);
      console.log(`👥 Total de consultores: ${equipe.members?.length || 0}\n`);
      
      let totalLeads = 0;
      let consultoresComLeads = 0;
      
      console.log('📊 LEADS POR CONSULTOR:\n');
      
      if (equipe.members && equipe.members.length > 0) {
        for (const consultor of equipe.members) {
          const leadsCount = consultor.leads?.length || 0;
          totalLeads += leadsCount;
          
          if (leadsCount > 0) {
            consultoresComLeads++;
          }
          
          console.log(`👤 ${consultor.name}`);
          console.log(`   📧 Email: ${consultor.email}`);
          console.log(`   📈 Leads: ${leadsCount}`);
          
          // Mostrar alguns leads como exemplo
          if (leadsCount > 0) {
            console.log(`   📋 Exemplos de leads:`);
            consultor.leads.slice(0, 3).forEach((lead, index) => {
              console.log(`      ${index + 1}. ${lead.name} - ${lead.status} - R$ ${lead.potentialValue}`);
            });
            if (leadsCount > 3) {
              console.log(`      ... e mais ${leadsCount - 3} leads`);
            }
          }
          console.log('');
        }
      }
      
      console.log('📈 RESUMO ESTATÍSTICO:');
      console.log(`   🏢 Equipe: ${equipe.name}`);
      console.log(`   👥 Total de consultores: ${equipe.members?.length || 0}`);
      console.log(`   📊 Total de leads: ${totalLeads}`);
      console.log(`   👤 Consultores com leads: ${consultoresComLeads}`);
      console.log(`   📈 Média de leads por consultor: ${((totalLeads / (equipe.members?.length || 1))).toFixed(1)}`);
      
      // Análise por status
      const statusCount = {};
      equipe.members.forEach(consultor => {
        consultor.leads?.forEach(lead => {
          statusCount[lead.status] = (statusCount[lead.status] || 0) + 1;
        });
      });
      
      if (Object.keys(statusCount).length > 0) {
        console.log(`\n📊 DISTRIBUIÇÃO POR STATUS:`);
        Object.entries(statusCount).forEach(([status, count]) => {
          console.log(`   ${status}: ${count} leads`);
        });
      }
      
    } else {
      console.log('⚠️  Gerente não tem equipe atribuída');
    }
    
  } catch (error) {
    console.error('❌ Erro ao verificar leads:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkGerenteLeads(); 