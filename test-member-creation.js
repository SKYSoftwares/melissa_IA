const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function testMemberCreation() {
  try {
    console.log('=== TESTANDO CRIAÇÃO DE MEMBROS ===');
    
    // 1. Verificar membros existentes
    console.log('\n--- Membros existentes ---');
    const existingMembers = await prisma.team.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        position: true,
        password: true
      }
    });
    
    existingMembers.forEach(member => {
      console.log(`- ${member.name} (${member.email}) - ${member.position}`);
      console.log(`  Senha: ${member.password ? 'SIM' : 'NÃO'}`);
      if (member.password) {
        console.log(`  Tipo: ${member.password.startsWith('$2') ? 'Hash bcrypt' : 'Texto plano'}`);
      }
      console.log('');
    });
    
    // 2. Criar um membro de teste
    console.log('\n--- Criando membro de teste ---');
    const testPassword = 'teste123';
    const hashedPassword = await bcrypt.hash(testPassword, 12);
    
    const testMember = await prisma.team.create({
      data: {
        name: 'Teste Consultor',
        email: 'teste@empresa.com',
        position: 'Consultor',
        password: hashedPassword
      }
    });
    
    console.log('Membro criado:', testMember);
    console.log('Senha original:', testPassword);
    console.log('Senha hash:', hashedPassword);
    
    // 3. Testar login com a senha
    console.log('\n--- Testando login ---');
    const member = await prisma.team.findUnique({
      where: { email: 'teste@empresa.com' }
    });
    
    if (member) {
      const isPasswordValid = await bcrypt.compare(testPassword, member.password);
      console.log('Login válido:', isPasswordValid);
      
      if (isPasswordValid) {
        console.log('✅ Senha funcionando corretamente!');
      } else {
        console.log('❌ Problema com a senha!');
      }
    }
    
    // 4. Limpar membro de teste
    console.log('\n--- Limpando membro de teste ---');
    await prisma.team.delete({
      where: { email: 'teste@empresa.com' }
    });
    console.log('Membro de teste removido');
    
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testMemberCreation(); 