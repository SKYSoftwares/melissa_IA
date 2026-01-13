const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const email = 'eduardomartinspereira20@gmail.com';
  const novaSenha = '123456'; // Altere para a senha desejada
  const hash = await bcrypt.hash(novaSenha, 10);

  const user = await prisma.user.update({
    where: { email },
    data: { password: hash },
  });

  console.log('Senha atualizada para:', email);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect()); 