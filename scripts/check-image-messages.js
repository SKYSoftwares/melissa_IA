const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkImageMessages() {
  try {
    console.log("🔍 Verificando mensagens de imagem...");

    // Buscar todas as mensagens de imagem
    const imageMessages = await prisma.whatsAppMessage.findMany({
      where: {
        type: "image"
      },
      orderBy: {
        timestamp: 'desc'
      },
      take: 5
    });

    console.log(`📸 Encontradas ${imageMessages.length} mensagens de imagem:`);

    for (const message of imageMessages) {
      console.log(`\n📱 Mensagem ID: ${message.messageId}`);
      console.log(`   Type: ${message.type}`);
      console.log(`   MediaUrl: ${message.mediaUrl || 'null'}`);
      console.log(`   MediaType: ${message.mediaType || 'null'}`);
      console.log(`   Body: ${message.body || 'null'}`);
      console.log(`   Caption: ${message.caption || 'null'}`);
      console.log(`   FileName: ${message.fileName || 'null'}`);
      console.log(`   Timestamp: ${message.timestamp}`);
    }

  } catch (error) {
    console.error("❌ Erro ao verificar mensagens:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkImageMessages(); 