#!/usr/bin/env node

/**
 * Script para testar a conexão Google de um usuário
 * Execute: node scripts/test-google-connection.js
 */

// Carregar variáveis de ambiente do arquivo .env
require("dotenv").config();

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function testGoogleConnection() {
  console.log("🔍 Testando conexão Google dos usuários...\n");

  try {
    // Buscar usuários com conexão Google
    const usersWithGoogle = await prisma.user.findMany({
      where: {
        googleAccessToken: {
          not: null,
        },
      },
      select: {
        id: true,
        email: true,
        googleEmail: true,
        googleAccessToken: true,
        googleRefreshToken: true,
      },
    });

    console.log(`👥 Usuários com Google conectado: ${usersWithGoogle.length}`);

    usersWithGoogle.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email}`);
      console.log(`   Google Email: ${user.googleEmail}`);
      console.log(`   Access Token: ${user.googleAccessToken ? "✅" : "❌"}`);
      console.log(`   Refresh Token: ${user.googleRefreshToken ? "✅" : "❌"}`);
      console.log("");
    });

    // Buscar membros da equipe com conexão Google
    const teamWithGoogle = await prisma.team.findMany({
      where: {
        googleAccessToken: {
          not: null,
        },
      },
      select: {
        id: true,
        email: true,
        googleEmail: true,
        googleAccessToken: true,
        googleRefreshToken: true,
      },
    });

    console.log(
      `👥 Membros da equipe com Google conectado: ${teamWithGoogle.length}`
    );

    teamWithGoogle.forEach((member, index) => {
      console.log(`${index + 1}. ${member.email}`);
      console.log(`   Google Email: ${member.googleEmail}`);
      console.log(`   Access Token: ${member.googleAccessToken ? "✅" : "❌"}`);
      console.log(
        `   Refresh Token: ${member.googleRefreshToken ? "✅" : "❌"}`
      );
      console.log("");
    });

    const totalConnected = usersWithGoogle.length + teamWithGoogle.length;
    console.log(`📊 Total de contas Google conectadas: ${totalConnected}`);

    if (totalConnected === 0) {
      console.log("⚠️  Nenhuma conta Google conectada!");
      console.log(
        "🔗 Teste acessando: https://crm.drzeuscapital.com.br/agenda"
      );
    } else {
      console.log("✅ Sistema funcionando corretamente!");
    }
  } catch (error) {
    console.error("❌ Erro ao testar conexão:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testGoogleConnection();
