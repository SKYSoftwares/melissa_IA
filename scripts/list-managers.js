const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function listManagers() {
  try {
    console.log('👔 DIRETORES E GERENTES DA ORGANIZAÇÃO\n');
    
    // Buscar diretores
    const diretores = await prisma.team.findMany({
      where: {
        position: 'Diretor'
      },
      orderBy: {
        name: 'asc'
      }
    });
    
    console.log('👔 DIRETORES:');
    diretores.forEach((diretor, index) => {
      console.log(`   ${index + 1}. ${diretor.name}`);
      console.log(`      📧 Email: ${diretor.email}`);
      console.log(`      🆔 ID: ${diretor.id}`);
      console.log('');
    });
    
    // Buscar gerentes
    const gerentes = await prisma.team.findMany({
      where: {
        position: 'Gerente'
      },
      include: {
        managedTeams: {
          include: {
            members: {
              orderBy: {
                name: 'asc'
              }
            }
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });
    
    console.log('👨‍💼 GERENTES:');
    gerentes.forEach((gerente, index) => {
      console.log(`   ${index + 1}. ${gerente.name}`);
      console.log(`      📧 Email: ${gerente.email}`);
      console.log(`      🆔 ID: ${gerente.id}`);
      
      if (gerente.managedTeams.length > 0) {
        const equipe = gerente.managedTeams[0];
        console.log(`      🏢 Equipe: ${equipe.name}`);
        console.log(`      👥 Consultores na equipe: ${equipe.members.length}`);
      } else {
        console.log(`      ⚠️  Sem equipe atribuída`);
      }
      console.log('');
    });
    
    // Estatísticas
    const totalConsultores = gerentes.reduce((total, gerente) => {
      return total + (gerente.managedTeams[0]?.members.length || 0);
    }, 0);
    
    console.log('📊 ESTATÍSTICAS:');
    console.log(`👔 Total de Diretores: ${diretores.length}`);
    console.log(`👨‍💼 Total de Gerentes: ${gerentes.length}`);
    console.log(`👥 Total de Consultores distribuídos: ${totalConsultores}`);
    console.log(`📈 Média de consultores por gerente: ${(totalConsultores / gerentes.length).toFixed(1)}`);
    
    console.log('\n💡 Informações de acesso:');
    console.log('Senha padrão para todos: 123456');
    
    console.log('\n🎯 PARA TESTAR O SISTEMA:');
    console.log('1. Faça login com um diretor para ver todos os dados');
    console.log('2. Faça login com um gerente para ver dados de sua equipe');
    console.log('3. Faça login com um consultor para ver apenas seus dados');
    
  } catch (error) {
    console.error('❌ Erro ao listar gerentes:', error);
  } finally {
    await prisma.$disconnect();
  }
}

listManagers(); 