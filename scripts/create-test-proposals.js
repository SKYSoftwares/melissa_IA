const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  // Buscar leads de teste recém-criados
  const leads = await prisma.lead.findMany({
    where: {
      email: { contains: '@teste.com' },
      proposals: { none: {} }
    },
    take: 10,
    orderBy: { createdAt: 'desc' },
    include: { creator: true }
  });

  if (leads.length === 0) {
    console.log('Nenhum lead elegível encontrado para criar propostas.');
    process.exit(1);
  }

  let propostasCriadas = 0;
  for (let i = 0; i < leads.length && propostasCriadas < 10; i++) {
    const lead = leads[i];
    const user = lead.creator;
    if (!user) {
      console.log(`Lead ${lead.id} não possui creator vinculado. Pulando...`);
      continue;
    }

    const fileUrl = `https://exemplo.com/arquivo${Date.now()}_${i}.pdf`;
    const proposta = await prisma.proposal.create({
      data: {
        title: `Proposta Teste ${Date.now()}_${i}`,
        client: lead.name,
        company: 'Empresa Teste Ltda',
        value: (Math.random() * 100000 + 10000).toFixed(2),
        stage: 'pendente_envio',
        priority: 'medium',
        dueDate: null,
        description: 'Proposta de teste gerada automaticamente.',
        phone: lead.phone || '(11) 99999-9999',
        email: lead.email || `cliente${i+1}@teste.com`,
        leadId: lead.id,
        arquivoUrl: fileUrl,
        createdBy: user.id,
        proponentes: {
          create: [{
            name: `Proponente ${Date.now()}_${i}`,
            cpf: `0000000000${i+1}`.slice(-11),
            email: `proponente${Date.now()}_${i}@teste.com`,
            phone: '(11) 98888-8888'
          }]
        },
        imoveis: {
          create: [{
            address: `Rua Teste, ${i+1}00`,
            value: (Math.random() * 500000 + 100000).toFixed(2),
            description: 'Imóvel de teste.'
          }]
        },
        arquivos: {
          create: [{
            url: fileUrl,
            name: `arquivo${Date.now()}_${i}.pdf`
          }]
        }
      }
    });
    console.log(`Proposta criada para lead ${lead.name} (ID: ${lead.id})`);
    propostasCriadas++;
  }

  await prisma.$disconnect();
  console.log('Script finalizado!');
}

main().catch(e => { console.error(e); process.exit(1); }); 