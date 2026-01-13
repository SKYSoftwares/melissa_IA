const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUser() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'admin@zeuscapital.com' },
      select: {
        id: true,
        email: true,
        name: true,
        googleAccessToken: true,
        googleRefreshToken: true,
        googleEmail: true
      }
    });

    if (user) {
      console.log('Usuário encontrado:', user);
    } else {
      console.log('Usuário não encontrado');
    }
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUser(); 