const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugFrontend() {
  try {
    console.log('🔍 Debugando problema no frontend...\n');
    
    const gerenteEmail = 'gabrielanascimento17529470031181751141_1@yahoo.com';
    
    // Simular o que o frontend deveria fazer
    console.log('1️⃣ Verificando se o usuário existe no banco...');
    
    const user = await prisma.team.findUnique({
      where: { email: gerenteEmail },
      select: {
        id: true,
        name: true,
        email: true,
        position: true
      }
    });
    
    if (!user) {
      console.log('❌ Usuário não encontrado no banco');
      return;
    }
    
    console.log(`✅ Usuário encontrado:`);
    console.log(`   Nome: ${user.name}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Cargo: ${user.position}`);
    console.log(`   ID: ${user.id}\n`);
    
    // Simular a chamada da API que o frontend faz
    console.log('2️⃣ Simulando chamada da API...');
    
    const apiUrl = `/api/leads?userEmail=${encodeURIComponent(user.email)}&userRole=${encodeURIComponent(user.position.toLowerCase())}`;
    console.log(`🔗 URL da API: ${apiUrl}\n`);
    
    // Verificar se a API retorna dados
    console.log('3️⃣ Verificando se a API retorna dados...');
    
    const leads = await prisma.lead.findMany({
      where: {
        createdBy: {
          in: [
            // IDs dos membros da equipe da gerente
            'cmdaiu7xu0000v4dky3ju9p1k', // Ana Ferreira
            'cmdaiu9qq0004v4dkcd4aammc', // Ana Reis
            'cmdaiue18000dv4dky6h4z28l', // Alexandre Nascimento
            'cmdaiugxm000kv4dk3hxy4xo0', // Amanda Santos
            'cmdaiuk3x000sv4dkddkg87a9', // Beatriz Barros
            'cmdaiun4f000zv4dkeprfrl0m', // Andre Alves
            'cmdaiuq5a0016v4dksyxeotdo', // Andre Rocha
            'cmdaiusvp001cv4dk1nxmeic6', // Ana Moura
            'cmdaiuu6e0005v4g4t8s3recs', // Amanda Gomes
            'cmdaiuwgd001lv4dkwn4yedhr', // Bruno Freitas
            'cmdaiuwuk001mv4dkrtriuy1u', // Amanda Oliveira
            'cmdaiuxr2000ev4g4pr75ff1p', // Amanda Gomes
            'cmdaiyfdl000fv4nspvh9x9wr', // Adriana Soares
            'cmdaiymzq000wv4nsrrfvvsbs', // Andre Nascimento
            'cmdaiyqq30014v4ns1d23lcn0', // Alexandre Pereira
            'cmdaiyw56001fv4nspmahvl89', // Bruno Vieira
            'cmdaiyxzu001iv4nsgeo8iy7b', // Ana Santos
            'cmdajdw4v000fv4i4hx8qrgb4'  // Gerente (ela mesma)
          ]
        }
      },
      include: {
        creator: {
          select: {
            name: true,
            email: true,
            position: true
          }
        }
      },
      orderBy: { id: 'desc' }
    });
    
    console.log(`📊 Total de leads encontrados: ${leads.length}\n`);
    
    if (leads.length > 0) {
      console.log('✅ A API está retornando dados corretamente!');
      console.log('🔍 Possíveis problemas no frontend:');
      console.log('   1. Contexto de autenticação não está carregando o usuário');
      console.log('   2. A função fetchLeads não está sendo chamada');
      console.log('   3. O estado dbLeads não está sendo atualizado');
      console.log('   4. Problema na renderização dos componentes');
    } else {
      console.log('❌ A API não está retornando dados');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugFrontend(); 