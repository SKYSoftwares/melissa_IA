const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testLoginDirectly() {
  try {
    console.log('🔍 Testando login diretamente...\n');
    
    const email = 'gabrielanascimento17529470031181751141_1@yahoo.com';
    const password = '123456';
    
    console.log('📋 Credenciais de teste:');
    console.log(`   Email: ${email}`);
    console.log(`   Senha: ${password}\n`);
    
    // Buscar o usuário no banco
    const member = await prisma.team.findUnique({
      where: { email }
    });
    
    if (!member) {
      console.log('❌ Usuário não encontrado no banco');
      return;
    }
    
    console.log('✅ Usuário encontrado no banco:');
    console.log(`   Nome: ${member.name}`);
    console.log(`   Email: ${member.email}`);
    console.log(`   Cargo: ${member.position}`);
    console.log(`   ID: ${member.id}\n`);
    
    // Verificar senha
    const isPasswordValid = password === member.password;
    console.log(`🔐 Verificação de senha: ${isPasswordValid ? '✅ Válida' : '❌ Inválida'}\n`);
    
    if (!isPasswordValid) {
      console.log('❌ Senha incorreta');
      return;
    }
    
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
    
    // Simular resposta da API de login
    const loginResponse = {
      success: true,
      user: {
        id: member.id,
        name: member.name,
        email: member.email,
        role: role
      }
    };
    
    console.log('📤 Resposta que a API deveria retornar:');
    console.log(JSON.stringify(loginResponse, null, 2));
    console.log('');
    
    // Simular dados que seriam salvos no localStorage
    const localStorageData = {
      id: member.id,
      name: member.name,
      email: member.email,
      role: role
    };
    
    console.log('💾 Dados que seriam salvos no localStorage:');
    console.log(JSON.stringify(localStorageData, null, 2));
    console.log('');
    
    // Verificar se a API está funcionando
    console.log('🧪 Testando se a API está funcionando...');
    
    // Simular chamada da API de leads
    const leadsResponse = await fetch('http://localhost:3000/api/leads?userEmail=' + encodeURIComponent(email) + '&userRole=' + encodeURIComponent(role));
    
    if (leadsResponse.ok) {
      const leadsData = await leadsResponse.json();
      console.log(`✅ API de leads funcionando: ${leadsData.length} leads retornados`);
    } else {
      console.log('❌ API de leads não está funcionando');
    }
    
    console.log('\n🎯 INSTRUÇÕES PARA TESTE:');
    console.log('1. Acesse: http://localhost:3000/login');
    console.log('2. Use as credenciais acima');
    console.log('3. Após o login, acesse: http://localhost:3000/leads');
    console.log('4. Abra o console do navegador (F12) para ver os logs');
    console.log('5. Se não funcionar, execute no console: simulateLogin()');
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testLoginDirectly(); 