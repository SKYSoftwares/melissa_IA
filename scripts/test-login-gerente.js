const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testLoginGerente() {
  try {
    console.log('🔍 Testando login da gerente...\n');
    
    const gerenteEmail = 'gabrielanascimento17529470031181751141_1@yahoo.com';
    const senha = '123456';
    
    // Buscar a gerente no banco
    const member = await prisma.team.findUnique({
      where: { email: gerenteEmail }
    });
    
    if (!member) {
      console.log('❌ Gerente não encontrada no banco');
      return;
    }
    
    console.log(`👤 Gerente encontrada:`);
    console.log(`   Nome: ${member.name}`);
    console.log(`   Email: ${member.email}`);
    console.log(`   Cargo: ${member.position}`);
    console.log(`   ID: ${member.id}\n`);
    
    // Simular a função mapPositionToRole
    function mapPositionToRole(position) {
      const positionLower = position.toLowerCase();
      
      if (positionLower.includes('gerente')) return 'gerente';
      if (positionLower.includes('administrador')) return 'administrador';
      if (positionLower.includes('consultor')) return 'usuario';
      if (positionLower.includes('diretor')) return 'diretor';
      
      return 'usuario'; // padrão
    }
    
    const role = mapPositionToRole(member.position);
    console.log(`🎭 Role mapeado: ${role}\n`);
    
    // Simular os dados que seriam salvos no localStorage
    const userData = {
      id: member.id,
      name: member.name,
      email: member.email,
      role: role
    };
    
    console.log(`💾 Dados que seriam salvos no localStorage:`);
    console.log(JSON.stringify(userData, null, 2));
    console.log('');
    
    // Simular a chamada da API de leads
    const apiUrl = `/api/leads?userEmail=${encodeURIComponent(userData.email)}&userRole=${encodeURIComponent(userData.role)}`;
    console.log(`🔗 URL da API que seria chamada:`);
    console.log(apiUrl);
    console.log('');
    
    // Verificar se a API retorna dados
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
    
    console.log(`📊 Total de leads que deveriam aparecer: ${leads.length}\n`);
    
    if (leads.length > 0) {
      console.log('✅ Tudo está funcionando corretamente!');
      console.log('🔍 Instruções para testar:');
      console.log('   1. Faça logout se estiver logado');
      console.log('   2. Acesse a página de login');
      console.log('   3. Use as credenciais da gerente:');
      console.log(`      Email: ${gerenteEmail}`);
      console.log(`      Senha: ${senha}`);
      console.log('   4. Após o login, acesse a página de leads');
      console.log('   5. Você deveria ver os 100 leads da equipe');
    } else {
      console.log('❌ Não há leads para mostrar');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testLoginGerente(); 