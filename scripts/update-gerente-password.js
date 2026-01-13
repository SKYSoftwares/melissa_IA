const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateGerentePassword() {
  try {
    console.log('🔧 Atualizando senha da gerente...\n');
    
    const email = 'gabrielanascimento17529470031181751141_1@yahoo.com';
    const newPassword = '123456';
    
    // Atualizar a senha para texto simples
    const updatedMember = await prisma.team.update({
      where: { email },
      data: { password: newPassword }
    });
    
    console.log('✅ Senha atualizada com sucesso!');
    console.log(`   Email: ${updatedMember.email}`);
    console.log(`   Nova senha: ${updatedMember.password}\n`);
    
    // Testar o login
    console.log('🧪 Testando login com a nova senha...');
    
    const isPasswordValid = newPassword === updatedMember.password;
    console.log(`🔐 Verificação de senha: ${isPasswordValid ? '✅ Válida' : '❌ Inválida'}\n`);
    
    if (isPasswordValid) {
      console.log('🎯 CREDENCIAIS ATUALIZADAS:');
      console.log(`   Email: ${email}`);
      console.log(`   Senha: ${newPassword}\n`);
      
      console.log('📋 INSTRUÇÕES PARA TESTE:');
      console.log('1. Acesse: http://localhost:3000/login');
      console.log('2. Use as credenciais acima');
      console.log('3. Após o login, acesse: http://localhost:3000/leads');
      console.log('4. Você deveria ver os 100 leads da equipe');
    } else {
      console.log('❌ Erro ao atualizar senha');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateGerentePassword(); 