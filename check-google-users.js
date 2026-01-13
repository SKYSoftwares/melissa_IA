const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkGoogleUsers() {
  try {
    console.log('=== VERIFICANDO USUÁRIOS COM GOOGLE ===');
    
    // Verificar usuários na tabela User
    console.log('\n--- Usuários na tabela User ---');
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        googleAccessToken: true,
        googleRefreshToken: true,
        googleEmail: true
      }
    });
    
    users.forEach(user => {
      console.log(`- ${user.name} (${user.email})`);
      console.log(`  Google Access Token: ${user.googleAccessToken ? 'SIM' : 'NÃO'}`);
      console.log(`  Google Refresh Token: ${user.googleRefreshToken ? 'SIM' : 'NÃO'}`);
      console.log(`  Google Email: ${user.googleEmail || 'NÃO'}`);
      console.log('');
    });
    
    // Verificar usuários na tabela Team
    console.log('\n--- Usuários na tabela Team ---');
    const teamMembers = await prisma.team.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        position: true,
        googleAccessToken: true,
        googleRefreshToken: true,
        googleEmail: true
      }
    });
    
    teamMembers.forEach(member => {
      console.log(`- ${member.name} (${member.email}) - ${member.position}`);
      console.log(`  Google Access Token: ${member.googleAccessToken ? 'SIM' : 'NÃO'}`);
      console.log(`  Google Refresh Token: ${member.googleRefreshToken ? 'SIM' : 'NÃO'}`);
      console.log(`  Google Email: ${member.googleEmail || 'NÃO'}`);
      console.log('');
    });
    
    // Verificar se há algum usuário com tokens do Google
    const usersWithGoogle = users.filter(u => u.googleAccessToken && u.googleRefreshToken);
    const teamWithGoogle = teamMembers.filter(t => t.googleAccessToken && t.googleRefreshToken);
    
    console.log('\n=== RESUMO ===');
    console.log(`Usuários com Google (User): ${usersWithGoogle.length}`);
    console.log(`Usuários com Google (Team): ${teamWithGoogle.length}`);
    
    if (usersWithGoogle.length === 0 && teamWithGoogle.length === 0) {
      console.log('\n❌ NENHUM USUÁRIO CONECTADO AO GOOGLE!');
      console.log('Você precisa conectar uma conta Google primeiro.');
    } else {
      console.log('\n✅ USUÁRIOS CONECTADOS AO GOOGLE:');
      usersWithGoogle.forEach(u => console.log(`- ${u.name} (${u.email})`));
      teamWithGoogle.forEach(t => console.log(`- ${t.name} (${t.email})`));
    }
    
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkGoogleUsers(); 