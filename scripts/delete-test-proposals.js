const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const propostas = await prisma.proposal.findMany({
    where: {
      title: { startsWith: 'Proposta Teste' }
    },
    select: { id: true }
  });

  if (propostas.length === 0) {
    console.log('Nenhuma proposta de teste encontrada para remover.');
    process.exit(0);
  }

  for (const proposta of propostas) {
    await prisma.proposal.delete({ where: { id: proposta.id } });
    console.log(`Proposta de teste removida: ${proposta.id}`);
  }

  await prisma.$disconnect();
  console.log('Remoção concluída!');
}

main().catch(e => { console.error(e); process.exit(1); }); 