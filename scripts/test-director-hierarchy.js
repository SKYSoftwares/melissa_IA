const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testDirectorHierarchy() {
  try {
    console.log('🔍 Testando hierarquia de diretores...\n');

    // 1. Buscar todos os diretores
    const diretores = await prisma.team.findMany({
      where: {
        permissions: {
          some: {
            role: 'diretor'
          }
        }
      },
      include: {
        permissions: true
      }
    });

    console.log(`📊 Encontrados ${diretores.length} diretores:`);
    diretores.forEach(diretor => {
      console.log(`  - ${diretor.name} (${diretor.email})`);
    });

    console.log('\n' + '='.repeat(50) + '\n');

    // 2. Para cada diretor, verificar sua hierarquia
    for (const diretor of diretores) {
      console.log(`🎯 Analisando diretor: ${diretor.name}`);
      
      // Buscar gerentes sob este diretor
      const gerentesSobDiretor = await prisma.team.findMany({
        where: {
          directorId: diretor.id,
          permissions: {
            some: {
              role: 'gerente'
            }
          }
        },
        include: {
          managedTeams: {
            include: {
              members: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  position: true
                }
              }
            }
          }
        }
      });

      console.log(`  📋 Gerentes sob ${diretor.name}: ${gerentesSobDiretor.length}`);
      
      let totalConsultores = 0;
      
      for (const gerente of gerentesSobDiretor) {
        console.log(`    👤 ${gerente.name} (${gerente.email})`);
        
        const consultoresDoGerente = gerente.managedTeams.reduce((total, team) => {
          const consultores = team.members.filter(member => member.position === 'consultor');
          console.log(`      📁 Equipe: ${team.name} - ${consultores.length} consultores`);
          consultores.forEach(consultor => {
            console.log(`        👤 ${consultor.name} (${consultor.email})`);
          });
          return total + consultores.length;
        }, 0);
        
        totalConsultores += consultoresDoGerente;
        console.log(`      📊 Total de consultores do gerente: ${consultoresDoGerente}`);
      }

      console.log(`  📊 Resumo para ${diretor.name}:`);
      console.log(`    - Gerentes: ${gerentesSobDiretor.length}`);
      console.log(`    - Consultores: ${totalConsultores}`);
      console.log(`    - Total de membros: ${gerentesSobDiretor.length + totalConsultores}`);

      // Verificar leads que o diretor deveria ver
      const leadsDoDiretor = await prisma.lead.findMany({
        where: {
          createdBy: diretor.id
        }
      });

      const leadsDosGerentes = await prisma.lead.findMany({
        where: {
          createdBy: {
            in: gerentesSobDiretor.map(g => g.id)
          }
        }
      });

      const consultoresIds = gerentesSobDiretor.flatMap(gerente => 
        gerente.managedTeams.flatMap(team => 
          team.members.filter(member => member.position === 'consultor').map(member => member.id)
        )
      );

      const leadsDosConsultores = await prisma.lead.findMany({
        where: {
          createdBy: {
            in: consultoresIds
          }
        }
      });

      console.log(`  📈 Leads que ${diretor.name} deveria ver:`);
      console.log(`    - Próprios leads: ${leadsDoDiretor.length}`);
      console.log(`    - Leads dos gerentes: ${leadsDosGerentes.length}`);
      console.log(`    - Leads dos consultores: ${leadsDosConsultores.length}`);
      console.log(`    - Total: ${leadsDoDiretor.length + leadsDosGerentes.length + leadsDosConsultores.length}`);

      console.log('\n' + '-'.repeat(30) + '\n');
    }

  } catch (error) {
    console.error('❌ Erro ao testar hierarquia:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDirectorHierarchy(); 