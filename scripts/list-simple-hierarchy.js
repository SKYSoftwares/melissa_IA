const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function listSimpleHierarchy() {
  try {
    console.log('🏢 Estrutura Hierárquica da Organização\n');
    
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
    
    console.log(`👨‍💼 Encontrados ${gerentes.length} gerentes:\n`);
    
    // Mostrar estrutura
    for (let diretorIndex = 0; diretorIndex < diretores.length; diretorIndex++) {
      const diretor = diretores[diretorIndex];
      
      console.log(`📋 DIRETOR ${diretorIndex + 1}: ${diretor.name}`);
      console.log(`   📧 Email: ${diretor.email}`);
      console.log('');
      
      // Mostrar gerentes (4 por diretor)
      const gerentesDoDiretor = gerentes.slice(diretorIndex * 4, (diretorIndex + 1) * 4);
      
      for (let gerenteIndex = 0; gerenteIndex < gerentesDoDiretor.length; gerenteIndex++) {
        const gerente = gerentesDoDiretor[gerenteIndex];
        
        console.log(`   👨‍💼 Gerente ${gerenteIndex + 1}: ${gerente.name}`);
        console.log(`      📧 Email: ${gerente.email}`);
        
        // Mostrar equipe do gerente
        if (gerente.managedTeams.length > 0) {
          const equipe = gerente.managedTeams[0];
          console.log(`      🏢 Equipe: ${equipe.name}`);
          console.log(`      👥 Consultores: ${equipe.members.length}`);
          
          // Mostrar primeiros 5 consultores
          equipe.members.slice(0, 5).forEach((consultor, index) => {
            console.log(`         ${index + 1}. ${consultor.name}`);
          });
          
          if (equipe.members.length > 5) {
            console.log(`         ... e mais ${equipe.members.length - 5} consultores`);
          }
        }
        
        console.log('');
      }
      
      console.log('─'.repeat(80));
      console.log('');
    }
    
    // Estatísticas
    const totalConsultores = gerentes.reduce((total, gerente) => {
      return total + (gerente.managedTeams[0]?.members.length || 0);
    }, 0);
    
    console.log('📊 ESTATÍSTICAS GERAIS:');
    console.log(`👔 Total de Diretores: ${diretores.length}`);
    console.log(`👨‍💼 Total de Gerentes: ${gerentes.length}`);
    console.log(`👥 Total de Consultores distribuídos: ${totalConsultores}`);
    console.log(`🏢 Total de Equipes: ${gerentes.length}`);
    console.log(`📈 Média de consultores por equipe: ${(totalConsultores / gerentes.length).toFixed(1)}`);
    
    console.log('\n💡 Informações de acesso:');
    console.log('Senha padrão para todos: 123456');
    
    // Mostrar consultores sem equipe
    const consultoresSemEquipe = await prisma.team.findMany({
      where: {
        position: 'Consultor',
        teamId: null
      },
      orderBy: {
        name: 'asc'
      }
    });
    
    if (consultoresSemEquipe.length > 0) {
      console.log(`\n⚠️  Consultores sem equipe (${consultoresSemEquipe.length}):`);
      consultoresSemEquipe.forEach((consultor, index) => {
        console.log(`   ${index + 1}. ${consultor.name} (${consultor.email})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erro ao listar hierarquia:', error);
  } finally {
    await prisma.$disconnect();
  }
}

listSimpleHierarchy(); 