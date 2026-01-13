const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function listGerentes() {
  try {
    console.log('👨‍💼 GERENTES DISPONÍVEIS PARA TESTE\n');
    
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
    
    console.log(`📊 Total de gerentes: ${gerentes.length}\n`);
    
    gerentes.forEach((gerente, index) => {
      console.log(`${index + 1}. ${gerente.name}`);
      console.log(`   📧 Email: ${gerente.email}`);
      console.log(`   🔑 Senha: 123456`);
      console.log(`   🆔 ID: ${gerente.id}`);
      
      // Verificar se tem equipe
      if (gerente.managedTeams && gerente.managedTeams.length > 0) {
        const equipe = gerente.managedTeams[0];
        console.log(`   🏢 Equipe: ${equipe.name}`);
        console.log(`   👥 Consultores na equipe: ${equipe.members?.length || 0}`);
        
        // Mostrar alguns consultores da equipe
        if (equipe.members && equipe.members.length > 0) {
          console.log(`   📋 Consultores:`);
          equipe.members.slice(0, 3).forEach((consultor, idx) => {
            console.log(`      ${idx + 1}. ${consultor.name} (${consultor.email})`);
          });
          if (equipe.members.length > 3) {
            console.log(`      ... e mais ${equipe.members.length - 3} consultores`);
          }
        }
      } else {
        console.log(`   ⚠️  Sem equipe atribuída`);
      }
      
      console.log('');
    });
    
    console.log('💡 INSTRUÇÕES PARA TESTE:');
    console.log('1. Faça login com um dos gerentes acima');
    console.log('2. Acesse a página /conta');
    console.log('3. Vá para a aba "Equipes"');
    console.log('4. Verifique se aparece a equipe do gerente');
    console.log('5. Verifique se aparecem os consultores da equipe');
    
  } catch (error) {
    console.error('❌ Erro ao listar gerentes:', error);
  } finally {
    await prisma.$disconnect();
  }
}

listGerentes(); 