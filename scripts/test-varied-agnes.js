// Script para testar a IA Agnes com máxima variação
const fetch = require("node-fetch");

async function testVariedAgnes() {
  console.log("🎭 Testando IA Agnes com Máxima Variação...\n");

  const testQuestions = [
    "Como funciona a plataforma que estou usando?",
    "Como funciona a plataforma que estou usando?", // Pergunta repetida
    "Como funciona a plataforma que estou usando?", // Outra repetida
    "O que é Home Equity?",
    "O que é Home Equity?", // Pergunta repetida
    "Como funciona o consórcio?",
    "Quais são os produtos da Dr. Zeus Capital?",
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
        console.log(`✅ Resposta: ${data.answer.substring(0, 200)}...`);
        console.log(`📚 Fonte: ${data.source || "knowledge_base"}`);
        console.log(`🧠 Contexto: ${data.context || "new"}`);
        console.log(`🎭 Personalidade: ${data.personality || "padrão"}`);
        console.log(`🎯 Seed: ${data.seed || "N/A"}`);
        console.log(`📖 Citações: ${data.citations?.length || 0}`);
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
testVariedAgnes().catch(console.error);
