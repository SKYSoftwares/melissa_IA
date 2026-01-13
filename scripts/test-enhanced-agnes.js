// Script para testar a IA Agnes melhorada
const fetch = require("node-fetch");

async function testEnhancedAgnes() {
  console.log("🧪 Testando IA Agnes Melhorada...\n");

  const testQuestions = [
    "O que é Home Equity?",
    "Como funciona o consórcio?",
    "Quais são os produtos da Dr. Zeus Capital?",
    "Como posso fazer uma simulação?",
    "Quais são as taxas de juros?",
  ];

  for (const question of testQuestions) {
    console.log(`❓ Pergunta: ${question}`);

    try {
      const response = await fetch(
        "http://localhost:3000/api/agnes/ask-enhanced",
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
        console.log(`✅ Resposta: ${data.answer.substring(0, 100)}...`);
        console.log(`📚 Fonte: ${data.source || "knowledge_base"}`);
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
  }
}

// Executar teste
testEnhancedAgnes().catch(console.error);
