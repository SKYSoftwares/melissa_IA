import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const { contactId, sessionId, archived } = await req.json();
    console.log("🔄 [whatsapp/archive] Recebido:", {
      contactId,
      sessionId,
      archived,
    });

    if (!contactId || !sessionId || typeof archived !== "boolean") {
      console.error("❌ [whatsapp/archive] Parâmetros inválidos:", {
        contactId,
        sessionId,
        archived,
      });
      return NextResponse.json(
        {
          status: false,
          error: "contactId, sessionId e archived são obrigatórios",
        },
        { status: 400 }
      );
    }

    console.log("🔄 [whatsapp/archive] Arquivando mensagens do contato:", {
      contactId,
      sessionId,
    });

    // Arquivar todas as mensagens do contato na sessão específica
    const updated = await prisma.whatsAppMessage.updateMany({
      where: {
        contactId: contactId,
        sessionId: sessionId,
      },
      data: { archived },
    });

    if (updated.count === 0) {
      console.error(
        "❌ [whatsapp/archive] Nenhuma mensagem encontrada para o contato na sessão:",
        {
          contactId,
          sessionId,
        }
      );
      return NextResponse.json(
        {
          status: false,
          error:
            "Nenhuma mensagem encontrada para o contato na sessão especificada",
        },
        { status: 404 }
      );
    }

    console.log("✅ [whatsapp/archive] Mensagens arquivadas:", {
      contactId,
      sessionId,
      archived,
      messagesCount: updated.count,
    });

    return NextResponse.json({
      status: true,
      contact: { id: contactId, sessionId, archived },
      messagesArchived: updated.count,
    });
  } catch (err: any) {
    console.error("❌ [whatsapp/archive] error:", err);
    return NextResponse.json(
      { status: false, error: err?.message || "Erro interno" },
      { status: 500 }
    );
  }
}
