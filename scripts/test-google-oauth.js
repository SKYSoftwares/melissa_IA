#!/usr/bin/env node

/**
 * Script para testar a configuração do Google OAuth 2.0
 * Execute: node scripts/test-google-oauth.js
 */

// Carregar variáveis de ambiente do arquivo .env
require("dotenv").config();

console.log("🔍 Verificando configuração do Google OAuth 2.0...\n");

// Verificar variáveis de ambiente
const requiredEnvVars = [
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "GOOGLE_REDIRECT_URI",
];

let allConfigured = true;

console.log("📋 Variáveis de Ambiente:");
requiredEnvVars.forEach((envVar) => {
  const value = process.env[envVar];
  if (value && value !== `your_${envVar.toLowerCase()}_here`) {
    console.log(`✅ ${envVar}: ${value.substring(0, 20)}...`);
  } else {
    console.log(`❌ ${envVar}: NÃO CONFIGURADO`);
    allConfigured = false;
  }
});

console.log("\n🔗 URLs de Teste:");
console.log("1. Login Google: http://localhost:3000/api/google/login");
console.log("2. Página de Agenda: http://localhost:3000/agenda");
console.log("3. Página de Leads: http://localhost:3000/leads");

if (allConfigured) {
  console.log("\n✅ Configuração parece estar correta!");
  console.log("🚀 Teste acessando: http://localhost:3000/agenda");
} else {
  console.log("\n❌ Configure as variáveis de ambiente primeiro!");
  console.log(
    "📝 Crie um arquivo .env.local com as credenciais do Google Cloud Console"
  );
}

console.log("\n📚 Documentação completa: GOOGLE_OAUTH_SETUP.md");
