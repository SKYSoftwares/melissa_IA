const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testAvailableManagers() {
  try {
    console.log('🔍 Testando gerentes disponíveis...\n');

    // Buscar todos os gerentes
    const allManagers = await prisma.team.findMany({
      where: {
        permissions: {
          some: {
            role: 'gerente'
          }
        }
      },
      include: {
        permissions: true
      }
    });

    console.log(`📊 Total de gerentes no sistema: ${allManagers.length}`);

    // Separar gerentes por status
    const assignedManagers = allManagers.filter(manager => manager.directorId);
    const availableManagers = allManagers.filter(manager => !manager.directorId);

    console.log('\n📋 Gerentes Associados a Diretores:');
    for (const manager of assignedManagers) {
      const director = await prisma.team.findUnique({
        where: { id: manager.directorId },
        select: { name: true, email: true }
      });
      
      console.log(`  👤 ${manager.name} (${manager.email})`);
      console.log(`     Diretor: ${director?.name || 'Não encontrado'} (${director?.email || 'N/A'})`);
    }

    console.log('\n📋 Gerentes Disponíveis:');
    for (const manager of availableManagers) {
      console.log(`  👤 ${manager.name} (${manager.email})`);
    }

    console.log('\n📊 Resumo:');
    console.log(`  - Gerentes associados: ${assignedManagers.length}`);
    console.log(`  - Gerentes disponíveis: ${availableManagers.length}`);
    console.log(`  - Total: ${allManagers.length}`);

  } catch (error) {
    console.error('❌ Erro ao testar gerentes:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAvailableManagers(); 