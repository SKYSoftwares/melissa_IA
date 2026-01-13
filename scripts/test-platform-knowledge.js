// Script para testar conhecimento da plataforma Dr. Zeus Capital
const fetch = require("node-fetch");

async function testPlatformKnowledge() {
  console.log("🏢 Testando Conhecimento da Plataforma Dr. Zeus Capital...\n");

  const testQuestions = [
    "Qual o CRM que você está integrada?",
    "Como funciona a plataforma que estou usando?",
    "Como funciona a plataforma que estou usando?", // Pergunta repetida
    "O que é Home Equity?",
    "Como funciona o consórcio?",
    "Quais são as funcionalidades da plataforma?",
    "Como funciona o sistema de leads?",
    "Quais integrações a plataforma tem?",
  ];

  for (let i = 0; i < testQuestions.length; i++) {
    const question = testQuestions[i];
    console.log(`❓ Pergunta ${i + 1}: ${question}`);

    try {
      const response = await fetch(
        "http://localhost:3000/api/agnes/ask-varied",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ question }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Resposta: ${data.answer.substring(0, 300)}...`);
        console.log(`📚 Fonte: ${data.source || "knowledge_base"}`);
        console.log(`🧠 Contexto: ${data.context || "new"}`);
        console.log(`🎭 Personalidade: ${data.personality || "padrão"}`);
        console.log(`🎯 Seed: ${data.seed || "N/A"}`);
        console.log(`📖 Citações: ${data.citations?.length || 0}`);

        // Verificar se menciona Dr. Zeus Capital
        const mentionsDrZeus =
          data.answer.toLowerCase().includes("dr. zeus capital") ||
          data.answer.toLowerCase().includes("dr zeus capital");
        console.log(
          `🏢 Menciona Dr. Zeus Capital: ${
            mentionsDrZeus ? "✅ SIM" : "❌ NÃO"
          }`
        );

        // Verificar se menciona CRM
        const mentionsCRM = data.answer.toLowerCase().includes("crm");
        console.log(`💼 Menciona CRM: ${mentionsCRM ? "✅ SIM" : "❌ NÃO"}`);

        console.log("---");
      } else {
        const error = await response.text();
        console.log(`❌ Erro: ${error}`);
        console.log("---");
      }
    } catch (error) {
      console.log(`❌ Erro de conexão: ${error.message}`);
      console.log("---");
    }

    // Pequena pausa entre perguntas
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
}

// Executar teste
testPlatformKnowledge().catch(console.error);
