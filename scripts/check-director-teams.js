const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDirectorTeams() {
  try {
    console.log('🔍 Verificando equipes dos diretores...\n');
    
    // Buscar diretores
    const diretores = await prisma.team.findMany({
      where: {
        position: 'Diretor'
      },
      orderBy: {
        name: 'asc'
      }
    });
    
    console.log(`👔 Encontrados ${diretores.length} diretores:\n`);
    
    for (const diretor of diretores) {
      console.log(`📋 Diretor: ${diretor.name}`);
      console.log(`   📧 Email: ${diretor.email}`);
      console.log(`   🆔 ID: ${diretor.id}\n`);
      
      // Buscar equipes que deveriam estar sob este diretor
      const equipes = await prisma.teamGroup.findMany({
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
      
      console.log(`   🏢 Equipes disponíveis (${equipes.length}):`);
      
      equipes.forEach((equipe, index) => {
        console.log(`      ${index + 1}. ${equipe.name}`);
        console.log(`         👨‍💼 Gerente: ${equipe.manager?.name || 'Não definido'}`);
        console.log(`         👥 Consultores: ${equipe.members?.length || 0}`);
      });
      
      console.log('\n' + '='.repeat(50) + '\n');
    }
    
  } catch (error) {
    console.error('❌ Erro ao verificar equipes dos diretores:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDirectorTeams(); 