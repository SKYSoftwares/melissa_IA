const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  // Buscar um lead de teste
  const lead = await prisma.lead.findFirst({
    where: { email: { contains: '@teste.com' } }
  });

  if (!lead) {
    console.log('Nenhum lead de teste encontrado.');
    process.exit(1);
  }

  console.log(`Testando com lead: ${lead.name} (ID: ${lead.id})`);

  // Criar alguns follow ups de teste
  const followups = [
    {
      observations: 'Primeiro contato realizado via telefone',
      tipeOfContact: 'ligacao',
      date: new Date('2024-01-15T10:00:00Z'),
      dateNextContact: new Date('2024-01-20T14:00:00Z'),
      leadId: lead.id
    },
    {
      observations: 'Enviado proposta por email',
      tipeOfContact: 'email',
      date: new Date('2024-01-16T15:30:00Z'),
      dateNextContact: new Date('2024-01-25T16:00:00Z'),
      leadId: lead.id
    },
    {
      observations: 'Reunião realizada para discutir detalhes',
      tipeOfContact: 'reuniao',
      date: new Date('2024-01-18T09:00:00Z'),
      dateNextContact: new Date('2024-01-30T10:00:00Z'),
      leadId: lead.id
    }
  ];

  for (const followup of followups) {
    await prisma.Followup.create({ data: followup });
    console.log(`Follow up criado: ${followup.observations}`);
  }

  // Buscar follow ups do lead
  const savedFollowups = await prisma.Followup.findMany({
    where: { leadId: lead.id },
    orderBy: { date: 'desc' }
  });

  console.log(`\nFollow ups encontrados para o lead: ${savedFollowups.length}`);
  savedFollowups.forEach((f, i) => {
    console.log(`${i + 1}. ${f.observations} (${f.tipeOfContact}) - ${f.date.toLocaleString()}`);
  });

  await prisma.$disconnect();
  console.log('\nTeste concluído!');
}

main().catch(e => { console.error(e); process.exit(1); }); 