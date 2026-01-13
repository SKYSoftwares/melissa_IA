const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function clearTestMessages() {
  try {
    console.log("🧹 Limpando mensagens de teste...");

    // Deletar mensagens de teste
    const deletedMessages = await prisma.whatsAppMessage.deleteMany({
      where: {
        messageId: {
          contains: "3ADB3B35394504180EBA"
        }
      }
    });

    console.log(`✅ Deletadas ${deletedMessages.count} mensagens de teste`);

  } catch (error) {
    console.error("❌ Erro ao limpar mensagens:", error);
  } finally {
    await prisma.$disconnect();
  }
}

clearTestMessages(); 