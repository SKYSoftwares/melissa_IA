// Script para testar a IA Agnes inteligente
const fetch = require("node-fetch");

async function testSmartAgnes() {
  console.log("🧠 Testando IA Agnes Inteligente...\n");

  const testQuestions = [
    "O que é Home Equity?",
    "O que é Home Equity?", // Pergunta repetida para testar variação
    "Como funciona o consórcio?",
    "Quais são os produtos da Dr. Zeus Capital?",
    "Como posso fazer uma simulação?",
    "Quais são as taxas de juros?",
    "O que é Home Equity?", // Outra pergunta repetida
  ];

  for (let i = 0; i < testQuestions.length; i++) {
    const question = testQuestions[i];
    console.log(`❓ Pergunta ${i + 1}: ${question}`);

    try {
      const response = await fetch(
        "http://localhost:3000/api/agnes/ask-smart",
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
        console.log(`✅ Resposta: ${data.answer.substring(0, 150)}...`);
        console.log(`📚 Fonte: ${data.source || "knowledge_base"}`);
        console.log(`🧠 Contexto: ${data.context || "new"}`);
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
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
}

// Executar teste
testSmartAgnes().catch(console.error);
