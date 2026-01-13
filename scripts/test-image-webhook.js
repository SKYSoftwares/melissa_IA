const fetch = require('node-fetch');

async function testImageWebhook() {
  const testData = {
    event: "received",
    session: "test-session",
    message: {
      id: "test-image-123",
      chatId: "5511999999999@c.us",
      from: "5511999999999@c.us",
      fromMe: false,
      timestamp: Math.floor(Date.now() / 1000),
      type: "image",
      body: "https://example.com/test-image.jpg",
      caption: "Teste de imagem",
      filename: "test-image.jpg",
      deprecatedMms3Url: "https://example.com/test-image.jpg",
      mimetype: "image/jpeg",
      isGroupMsg: false,
      isForwarded: false,
      isStatus: false,
      sender: {
        pushname: "Teste",
        name: "Teste"
      }
    }
  };

  try {
    console.log("🧪 Testando webhook com imagem...");
    console.log("📤 Enviando dados:", JSON.stringify(testData, null, 2));

    const response = await fetch('http://localhost:3000/api/whatsappwebhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    const result = await response.text();
    console.log("📥 Resposta:", response.status, result);

    if (response.ok) {
      console.log("✅ Webhook processado com sucesso!");
    } else {
      console.log("❌ Erro no webhook:", response.status);
    }
  } catch (error) {
    console.error("❌ Erro ao testar webhook:", error);
  }
}

testImageWebhook(); 