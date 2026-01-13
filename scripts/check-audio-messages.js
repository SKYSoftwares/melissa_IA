const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkAudioMessages() {
  try {
    console.log("🔍 Verificando mensagens de áudio...");

    // Buscar todas as mensagens de áudio
    const audioMessages = await prisma.whatsAppMessage.findMany({
      where: {
        OR: [
          { type: "ptt" },
          { type: "audio" },
          { mediaType: "audio" }
        ]
      },
      orderBy: {
        timestamp: 'desc'
      },
      take: 5
    });

    console.log(`🎵 Encontradas ${audioMessages.length} mensagens de áudio:`);

    for (const message of audioMessages) {
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

checkAudioMessages(); 