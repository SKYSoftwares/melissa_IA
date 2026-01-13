const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkGerentePassword() {
  try {
    console.log('🔍 Verificando senha da gerente...\n');
    
    const email = 'gabrielanascimento17529470031181751141_1@yahoo.com';
    
    // Buscar a gerente
    const member = await prisma.team.findUnique({
      where: { email }
    });
    
    if (!member) {
      console.log('❌ Gerente não encontrada');
      return;
    }
    
    console.log('✅ Gerente encontrada:');
    console.log(`   Nome: ${member.name}`);
    console.log(`   Email: ${member.email}`);
    console.log(`   Cargo: ${member.position}`);
    console.log(`   ID: ${member.id}`);
    console.log(`   Senha no banco: ${member.password}\n`);
    
    // Testar diferentes senhas
    const testPasswords = ['123456', '123456789', 'password', 'admin', 'gerente', '123'];
    
    console.log('🧪 Testando senhas:');
    testPasswords.forEach(password => {
      const isValid = password === member.password;
      console.log(`   "${password}": ${isValid ? '✅ VÁLIDA' : '❌ inválida'}`);
    });
    
    if (member.password === '123456') {
      console.log('\n✅ A senha "123456" está correta!');
    } else {
      console.log('\n❌ A senha "123456" está incorreta.');
      console.log(`💡 A senha correta é: "${member.password}"`);
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkGerentePassword(); 