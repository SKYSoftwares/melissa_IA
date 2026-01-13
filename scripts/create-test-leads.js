const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  // Buscar o primeiro usuário da equipe
  const user = await prisma.team.findFirst();
  if (!user) {
    console.log('Nenhum usuário encontrado na tabela Team.');
    process.exit(1);
  }
  const timestamp = Date.now();
  for (let i = 1; i <= 10; i++) {
    await prisma.lead.create({
      data: {
        name: `Lead Teste ${i}`,
        email: `lead${i}-${timestamp}@teste.com`,
        phone: `(11) 90000-000${i}`,
        product: 'consorcio',
        potentialValue: `${10000 * i}`,
        status: 'novos_leads',
        ocupation: 'Tester',
        createdBy: user.id,
        observations: '',
      }
    });
    console.log(`Lead Teste ${i} criado.`);
  }
  await prisma.$disconnect();
  console.log('Leads de teste criados!');
}

main().catch(e => { console.error(e); process.exit(1); }); 