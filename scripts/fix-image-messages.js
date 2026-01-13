const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixImageMessages() {
  try {
    console.log("🔧 Corrigindo mensagens de imagem...");

    // Buscar mensagens de imagem que têm URL no body
    const imageMessages = await prisma.whatsAppMessage.findMany({
      where: {
        type: "image",
        body: {
          contains: "https://"
        }
      }
    });

    console.log(`📸 Encontradas ${imageMessages.length} mensagens de imagem para corrigir`);

    for (const message of imageMessages) {
      console.log(`🔄 Corrigindo mensagem: ${message.messageId}`);
      console.log(`   Body atual: ${message.body}`);
      
      // Se o body contém uma URL do WhatsApp, mover para mediaUrl
      if (message.body && message.body.includes("mmg.whatsapp.net")) {
        await prisma.whatsAppMessage.update({
          where: { id: message.id },
          data: {
            mediaUrl: message.body,
            mediaType: "image",
            body: null, // Limpar o body
            fileName: message.fileName || `image_${Date.now()}.jpg`
          }
        });
        console.log(`   ✅ Corrigida: URL movida para mediaUrl`);
      } else {
        console.log(`   ⚠️ Não é uma URL do WhatsApp, mantendo como está`);
      }
    }

    console.log("✅ Correção concluída!");
  } catch (error) {
    console.error("❌ Erro ao corrigir mensagens:", error);
  } finally {
    await prisma.$disconnect();
  }
}

fixImageMessages(); 