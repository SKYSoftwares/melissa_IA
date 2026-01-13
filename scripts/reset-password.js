const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function resetPassword() {
  try {
    console.log('Redefinindo senha do administrador...');
    
    // Buscar o usuário administrador
    const adminUser = await prisma.team.findFirst({
      where: {
        email: 'admin@zeuscapital.com'
      }
    });

    if (!adminUser) {
      console.log('Usuário administrador não encontrado!');
      return;
    }

    console.log(`Usuário encontrado: ${adminUser.name} (${adminUser.email})`);
    
    // Nova senha
    const newPassword = '123456';
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    // Atualizar a senha
    await prisma.team.update({
      where: { id: adminUser.id },
      data: { password: hashedPassword }
    });

    console.log('\n✅ Senha redefinida com sucesso!');
    console.log(`Email: ${adminUser.email}`);
    console.log(`Nova senha: ${newPassword}`);
    console.log(`Cargo: ${adminUser.position}`);
    
  } catch (error) {
    console.error('Erro ao redefinir senha:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetPassword(); 