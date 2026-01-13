const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testDirectorsAPI() {
  try {
    console.log('🔍 Testando API de diretores...\n');

    // Simular a mesma lógica da API
    const diretores = await prisma.team.findMany({
      where: {
        permissions: {
          some: {
            role: 'diretor'
          }
        }
      },
      orderBy: { name: "asc" },
      include: {
        permissions: true,
        managedTeams: {
          include: {
            members: {
              select: { id: true }
            }
          }
        }
      }
    });

    console.log(`📊 Encontrados ${diretores.length} diretores na busca inicial`);

    // Para cada diretor, buscar os gerentes que ele gerencia e seus consultores
    const directorsWithHierarchy = await Promise.all(
      diretores.map(async (director) => {
        console.log(`\n🎯 Processando diretor: ${director.name}`);
        
        // Buscar gerentes que têm este diretor como directorId
        const managedManagers = await prisma.team.findMany({
          where: {
            directorId: director.id,
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
                  select: { id: true }
                }
              }
            }
          }
        });

        console.log(`  📋 Gerentes encontrados: ${managedManagers.length}`);

        // Calcular estatísticas
        const totalManagers = managedManagers.length;
        const totalConsultants = managedManagers.reduce((total, manager) => {
          return total + manager.managedTeams.reduce((teamTotal, team) => {
            return teamTotal + team.members.filter((member) => member.position === 'consultor').length;
          }, 0);
        }, 0);

        console.log(`  📊 Estatísticas: ${totalManagers} gerentes, ${totalConsultants} consultores`);

        return {
          ...director,
          managedManagers,
          totalManagers,
          totalConsultants,
          totalMembers: totalManagers + totalConsultants
        };
      })
    );

    console.log('\n📋 Resultado final:');
    console.log(JSON.stringify(directorsWithHierarchy, null, 2));

  } catch (error) {
    console.error('❌ Erro ao testar API:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDirectorsAPI(); 