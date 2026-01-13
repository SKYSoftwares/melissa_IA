const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function checkNewMember() {
  try {
    console.log('=== VERIFICANDO MEMBRO CRIADO ===');
    
    // Buscar o membro que foi criado
    const member = await prisma.team.findUnique({
      where: { email: 'debdhbh@gmail.com' }
    });
    
    if (member) {
      console.log('✅ Membro encontrado no banco:');
      console.log('- Nome:', member.name);
      console.log('- Email:', member.email);
      console.log('- Cargo:', member.position);
      console.log('- Senha:', member.password ? 'SIM' : 'NÃO');
      console.log('- Tipo de senha:', member.password?.startsWith('$2') ? 'Hash bcrypt' : 'Texto plano');
      
      // Testar login com senha gerada
      console.log('\n--- Testando login ---');
      const testPassword = 'dehdhe'; // Senha que foi gerada
      const isPasswordValid = await bcrypt.compare(testPassword, member.password);
      console.log('Login válido:', isPasswordValid);
      
      if (isPasswordValid) {
        console.log('✅ Login funcionando!');
      } else {
        console.log('❌ Problema no login');
        console.log('Senha testada:', testPassword);
        console.log('Hash no banco:', member.password);
      }
    } else {
      console.log('❌ Membro não encontrado no banco');
    }
    
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkNewMember(); 