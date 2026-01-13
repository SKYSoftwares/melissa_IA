const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugContaPage() {
  try {
    console.log('🔍 Debugando página de conta...\n');
    
    // Simular um usuário diretor
    const diretor = await prisma.team.findFirst({
      where: {
        position: 'Diretor'
      }
    });
    
    if (!diretor) {
      console.log('❌ Nenhum diretor encontrado');
      return;
    }
    
    console.log(`👔 Usuário simulado:`);
    console.log(`   Nome: ${diretor.name}`);
    console.log(`   Email: ${diretor.email}`);
    console.log(`   Cargo: ${diretor.position}`);
    console.log(`   ID: ${diretor.id}\n`);
    
    // Simular a função getFilteredTeams
    const teams = await prisma.teamGroup.findMany({
      include: {
        manager: true,
        members: {
          orderBy: {
            name: 'asc'
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });
    
    console.log(`🏢 Total de equipes no banco: ${teams.length}`);
    
    // Simular a lógica de filtro
    const userRole = diretor.position.toLowerCase();
    let filteredTeams = [];
    
    if (userRole === "administrador") {
      filteredTeams = teams;
      console.log('🔧 Filtro: Administrador - vê todas as equipes');
    } else if (userRole === "diretor") {
      filteredTeams = teams;
      console.log('🔧 Filtro: Diretor - vê todas as equipes');
    } else if (userRole === "gerente") {
      filteredTeams = teams.filter(team => team.managerId === diretor.id);
      console.log('🔧 Filtro: Gerente - vê apenas sua própria equipe');
    }
    
    console.log(`📊 Equipes filtradas: ${filteredTeams.length}\n`);
    
    // Mostrar algumas equipes filtradas
    console.log('📋 Equipes que o diretor deve ver:');
    filteredTeams.slice(0, 5).forEach((team, index) => {
      console.log(`   ${index + 1}. ${team.name}`);
      console.log(`      👨‍💼 Gerente: ${team.manager?.name || 'Não definido'}`);
      console.log(`      👥 Consultores: ${team.members?.length || 0}`);
    });
    
    if (filteredTeams.length > 5) {
      console.log(`   ... e mais ${filteredTeams.length - 5} equipes`);
    }
    
    console.log('\n✅ Debug concluído. O diretor deve conseguir ver todas as equipes.');
    
  } catch (error) {
    console.error('❌ Erro no debug:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugContaPage(); 