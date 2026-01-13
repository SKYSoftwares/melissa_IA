const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testDirectorLogin() {
  try {
    console.log('🔍 Testando login como diretor...\n');
    
    // Buscar um diretor
    const diretor = await prisma.team.findFirst({
      where: {
        position: 'Diretor'
      }
    });
    
    if (!diretor) {
      console.log('❌ Nenhum diretor encontrado');
      return;
    }
    
    console.log(`👔 Diretor encontrado:`);
    console.log(`   Nome: ${diretor.name}`);
    console.log(`   Email: ${diretor.email}`);
    console.log(`   ID: ${diretor.id}`);
    console.log(`   Cargo: ${diretor.position}\n`);
    
    // Buscar todas as equipes
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
    
    console.log(`🏢 Total de equipes: ${equipes.length}\n`);
    
    // Mostrar algumas equipes como exemplo
    console.log('📋 Exemplos de equipes:');
    equipes.slice(0, 5).forEach((equipe, index) => {
      console.log(`   ${index + 1}. ${equipe.name}`);
      console.log(`      👨‍💼 Gerente: ${equipe.manager?.name || 'Não definido'}`);
      console.log(`      👥 Consultores: ${equipe.members?.length || 0}`);
    });
    
    if (equipes.length > 5) {
      console.log(`   ... e mais ${equipes.length - 5} equipes`);
    }
    
    console.log('\n✅ Teste concluído. O diretor deve conseguir ver todas as equipes.');
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDirectorLogin(); 