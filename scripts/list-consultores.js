const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function listConsultores() {
  try {
    console.log('📋 Listando todos os consultores...\n');
    
    const consultores = await prisma.team.findMany({
      orderBy: {
        name: 'asc'
      }
    });
    
    if (consultores.length === 0) {
      console.log('❌ Nenhum consultor encontrado no banco de dados.');
      console.log('💡 Execute o script create-test-data.js para criar consultores de teste.');
      return;
    }
    
    console.log(`✅ Encontrados ${consultores.length} consultores:\n`);
    
    consultores.forEach((consultor, index) => {
      console.log(`${index + 1}. ${consultor.name}`);
      console.log(`   📧 Email: ${consultor.email}`);
      console.log(`   💼 Cargo: ${consultor.position}`);
      console.log(`   🆔 ID: ${consultor.id}`);
      console.log('');
    });
    
    console.log('\n📊 Estatísticas:');
    console.log(`Total de consultores: ${consultores.length}`);
    
    // Contar leads por consultor
    const leadsCount = await prisma.lead.groupBy({
      by: ['createdBy'],
      _count: {
        id: true
      }
    });
    
    console.log(`Total de leads: ${leadsCount.reduce((sum, item) => sum + item._count.id, 0)}`);
    console.log(`Média de leads por consultor: ${(leadsCount.reduce((sum, item) => sum + item._count.id, 0) / consultores.length).toFixed(1)}`);
    
    console.log('\n💡 Informações de acesso:');
    console.log('Senha padrão para todos os consultores: 123456');
    
  } catch (error) {
    console.error('❌ Erro ao listar consultores:', error);
  } finally {
    await prisma.$disconnect();
  }
}

listConsultores(); 