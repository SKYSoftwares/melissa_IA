const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testUserContext() {
  try {
    console.log('🔍 Testando contexto de usuário...\n');
    
    const gerenteEmail = 'gabrielanascimento17529470031181751141_1@yahoo.com';
    
    // Buscar o usuário
    const user = await prisma.team.findUnique({
      where: { email: gerenteEmail },
      select: {
        id: true,
        name: true,
        email: true,
        position: true
      }
    });
    
    if (!user) {
      console.log('❌ Usuário não encontrado');
      return;
    }
    
    console.log(`👤 Usuário encontrado:`);
    console.log(`   Nome: ${user.name}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Cargo: ${user.position}`);
    console.log(`   ID: ${user.id}\n`);
    
    // Simular a chamada da API
    const url = `/api/leads?userEmail=${encodeURIComponent(user.email)}&userRole=${encodeURIComponent(user.position.toLowerCase())}`;
    console.log(`🔗 URL da API: ${url}\n`);
    
    // Verificar se o usuário tem equipes
    const userWithTeams = await prisma.team.findUnique({
      where: { email: gerenteEmail },
      include: {
        managedTeams: {
          include: {
            members: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    });
    
    console.log(`🏢 Equipes gerenciadas: ${userWithTeams?.managedTeams?.length || 0}`);
    
    if (userWithTeams?.managedTeams) {
      userWithTeams.managedTeams.forEach((team, index) => {
        console.log(`   Equipe ${index + 1}: ${team.name}`);
        console.log(`   Membros: ${team.members.length}`);
      });
    }
    
    console.log('\n✅ Contexto de usuário está correto!');
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testUserContext(); 