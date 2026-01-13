const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testGerenteLeads() {
  try {
    console.log('🔍 Testando busca de leads para gerente...\n');
    
    const gerenteEmail = 'gabrielanascimento17529470031181751141_1@yahoo.com';
    
    // Buscar a gerente
    const gerente = await prisma.team.findUnique({
      where: { email: gerenteEmail },
      include: {
        managedTeams: {
          include: {
            members: {
              select: { id: true, name: true, email: true }
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
    console.log(`🆔 ID: ${gerente.id}`);
    console.log(`👥 Equipes gerenciadas: ${gerente.managedTeams.length}\n`);
    
    // Listar membros das equipes
    let totalMembers = 0;
    gerente.managedTeams.forEach((team, index) => {
      console.log(`🏢 Equipe ${index + 1}: ${team.name}`);
      console.log(`   👥 Membros: ${team.members.length}`);
      team.members.forEach(member => {
        console.log(`      - ${member.name} (${member.email})`);
      });
      totalMembers += team.members.length;
      console.log('');
    });
    
    console.log(`📊 Total de membros: ${totalMembers}\n`);
    
    // Simular a lógica da API para buscar leads
    const memberIds = gerente.managedTeams.flatMap(team => 
      team.members.map(member => member.id)
    );
    memberIds.push(gerente.id);
    
    console.log(`🔍 IDs dos membros para buscar leads:`);
    memberIds.forEach(id => console.log(`   - ${id}`));
    console.log('');
    
    // Buscar leads
    const leads = await prisma.lead.findMany({
      where: {
        createdBy: { in: memberIds }
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
      orderBy: { id: 'desc' }
    });
    
    console.log(`📊 Total de leads encontrados: ${leads.length}\n`);
    
    // Agrupar leads por criador
    const leadsByCreator = {};
    leads.forEach(lead => {
      const creatorName = lead.creator?.name || 'Desconhecido';
      if (!leadsByCreator[creatorName]) {
        leadsByCreator[creatorName] = [];
      }
      leadsByCreator[creatorName].push(lead);
    });
    
    console.log('📋 Leads por criador:');
    Object.entries(leadsByCreator).forEach(([creator, creatorLeads]) => {
      console.log(`   ${creator}: ${creatorLeads.length} leads`);
    });
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testGerenteLeads(); 