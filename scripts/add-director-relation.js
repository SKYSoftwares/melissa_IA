const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addDirectorRelation() {
  try {
    console.log('🔗 Adicionando relação entre diretores e gerentes...\n');
    
    // Buscar diretores
    const diretores = await prisma.team.findMany({
      where: {
        position: 'Diretor'
      },
      orderBy: {
        name: 'asc'
      }
    });
    
    console.log(`👔 Encontrados ${diretores.length} diretores`);
    
    // Buscar gerentes
    const gerentes = await prisma.team.findMany({
      where: {
        position: 'Gerente'
      },
      orderBy: {
        name: 'asc'
      }
    });
    
    console.log(`👨‍💼 Encontrados ${gerentes.length} gerentes\n`);
    
    // Distribuir gerentes entre diretores (4 gerentes por diretor)
    const gerentesPorDiretor = 4;
    
    for (let i = 0; i < diretores.length; i++) {
      const diretor = diretores[i];
      const inicio = i * gerentesPorDiretor;
      const fim = Math.min(inicio + gerentesPorDiretor, gerentes.length);
      const gerentesDoDiretor = gerentes.slice(inicio, fim);
      
      console.log(`📋 Diretor: ${diretor.name}`);
      console.log(`   🆔 ID: ${diretor.id}`);
      console.log(`   👨‍💼 Gerentes sob responsabilidade:`);
      
      for (const gerente of gerentesDoDiretor) {
        console.log(`      - ${gerente.name} (${gerente.id})`);
        
        // Atualizar o gerente para ter o diretor como responsável
        await prisma.team.update({
          where: { id: gerente.id },
          data: {
            directorId: diretor.id
          }
        });
      }
      
      console.log(`   ✅ ${gerentesDoDiretor.length} gerentes associados\n`);
    }
    
    console.log('🎉 Relação entre diretores e gerentes criada com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao adicionar relação:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addDirectorRelation(); 