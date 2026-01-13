const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function listHierarchy() {
  try {
    console.log('🏢 Estrutura Hierárquica da Organização\n');
    
    // Buscar diretores
    const diretores = await prisma.team.findMany({
      where: {
        position: 'Diretor'
      },
      include: {
        managedTeams: {
          include: {
            manager: true,
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
    
    if (diretores.length === 0) {
      console.log('❌ Nenhum diretor encontrado.');
      console.log('💡 Execute o script create-hierarchy.js primeiro.');
      return;
    }
    
    console.log(`👔 Encontrados ${diretores.length} diretores:\n`);
    
    let totalGerentes = 0;
    let totalConsultores = 0;
    let totalEquipes = 0;
    
    // Mostrar estrutura para cada diretor
    for (let diretorIndex = 0; diretorIndex < diretores.length; diretorIndex++) {
      const diretor = diretores[diretorIndex];
      
      console.log(`📋 DIRETOR ${diretorIndex + 1}: ${diretor.name}`);
      console.log(`   📧 Email: ${diretor.email}`);
      console.log(`   🆔 ID: ${diretor.id}`);
      console.log('');
      
      // Buscar gerentes que reportam a este diretor
      const gerentes = await prisma.team.findMany({
        where: {
          position: 'Gerente',
          managedTeams: {
            some: {
              members: {
                some: {
                  team: {
                    manager: {
                      managedTeams: {
                        some: {
                          managerId: diretor.id
                        }
                      }
                    }
                  }
                }
              }
            }
          }
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
      
      console.log(`   👨‍💼 Gerentes (${gerentes.length}):`);
      
      for (let gerenteIndex = 0; gerenteIndex < gerentes.length; gerenteIndex++) {
        const gerente = gerentes[gerenteIndex];
        
        console.log(`      ${gerenteIndex + 1}. ${gerente.name}`);
        console.log(`         📧 Email: ${gerente.email}`);
        
        // Mostrar equipe do gerente
        if (gerente.managedTeams.length > 0) {
          const equipe = gerente.managedTeams[0];
          console.log(`         🏢 Equipe: ${equipe.name}`);
          console.log(`         👥 Consultores (${equipe.members.length}):`);
          
          equipe.members.forEach((consultor, consultorIndex) => {
            console.log(`            ${consultorIndex + 1}. ${consultor.name} (${consultor.email})`);
          });
          
          totalConsultores += equipe.members.length;
        }
        
        console.log('');
        totalGerentes++;
        totalEquipes++;
      }
      
      console.log('─'.repeat(80));
      console.log('');
    }
    
    // Estatísticas gerais
    console.log('📊 ESTATÍSTICAS GERAIS:');
    console.log(`👔 Total de Diretores: ${diretores.length}`);
    console.log(`👨‍💼 Total de Gerentes: ${totalGerentes}`);
    console.log(`👥 Total de Consultores: ${totalConsultores}`);
    console.log(`🏢 Total de Equipes: ${totalEquipes}`);
    console.log(`📈 Média de consultores por equipe: ${(totalConsultores / totalEquipes).toFixed(1)}`);
    
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

listHierarchy(); 