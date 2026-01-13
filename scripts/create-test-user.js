const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    console.log('Verificando usuários existentes...');
    
    // Verificar se já existe algum usuário
    const existingUsers = await prisma.team.findMany();
    console.log(`Encontrados ${existingUsers.length} usuários no banco:`);
    
    existingUsers.forEach(user => {
      console.log(`- ${user.name} (${user.email}) - Cargo: ${user.position}`);
    });

    if (existingUsers.length === 0) {
      console.log('\nCriando usuário de teste...');
      
      // Criar hash da senha
      const password = '123456';
      const hashedPassword = await bcrypt.hash(password, 12);
      
      // Criar usuário de teste
      const testUser = await prisma.team.create({
        data: {
          name: 'Administrador',
          email: 'admin@zeus.com',
          position: 'Gerente',
          password: hashedPassword
        }
      });

      console.log('\n✅ Usuário de teste criado com sucesso!');
      console.log(`Email: ${testUser.email}`);
      console.log(`Senha: ${password}`);
      console.log(`Cargo: ${testUser.position}`);
      
      // Criar permissões para o usuário
      await prisma.teamPermission.create({
        data: {
          teamId: testUser.id,
          role: 'gerente',
          dashboard: true,
          whatsapp: true,
          propostas: true,
          simuladores: true,
          relatorios: true,
          campanhas: true,
          equipe: true,
          configuracoes: false
        }
      });

      console.log('✅ Permissões criadas para o usuário!');
      
    } else {
      console.log('\nUsuários já existem no banco. Use um dos emails listados acima para fazer login.');
      console.log('Se não souber a senha, você pode redefinir diretamente no banco ou usar a funcionalidade de alteração de senha.');
    }

  } catch (error) {
    console.error('Erro ao criar usuário de teste:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser(); 