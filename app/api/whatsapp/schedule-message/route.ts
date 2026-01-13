import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { DateTime } from "luxon";

const prisma = new PrismaClient();

type MessagePayload = {
  type: "text" | "image" | "video" | "audio" | "document";
  text?: string | null;
  imageUrl?: string | null;
  videoUrl?: string | null;
  audioUrl?: string | null;
  documentUrl?: string | null;
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      contactId, // id do WhatsAppContact selecionado na UI
      sessionName, // nome da sessão ativa (ex.: "ZEUS01")
      scheduledAt, // opcional (ISO string)
      type, // "text" | "image" | "video" | "audio" | "document"
      text,
      imageUrl,
      videoUrl,
      audioUrl,
      documentUrl,
    } = body as {
      contactId?: string;
      sessionName?: string;
      scheduledAt?: string | null;
      type?: MessagePayload["type"];
      text?: string | null;
      imageUrl?: string | null;
      videoUrl?: string | null;
      audioUrl?: string | null;
      documentUrl?: string | null;
    };

    console.log(body, "BD");

    if (!contactId || !sessionName || !type) {
      return NextResponse.json(
        {
          status: false,
          error: "contactId, sessionName e type são obrigatórios",
        },
        { status: 400 }
      );
    }

    // valida conteúdo conforme o tipo
    if (
      (type === "text" && !text) ||
      (type === "image" && !imageUrl) ||
      (type === "video" && !videoUrl) ||
      (type === "audio" && !audioUrl) ||
      (type === "document" && !documentUrl)
    ) {
      return NextResponse.json(
        { status: false, error: "Conteúdo incompatível com o tipo informado" },
        { status: 400 }
      );
    }

    // sessão conectada
    const session = await prisma.whatsAppSession.findFirst({
      where: { sessionName, connectionStatus: "CONNECTED" },
      select: { id: true, sessionName: true },
    });
    if (!session) {
      return NextResponse.json(
        { status: false, error: "Sessão não encontrada ou desconectada" },
        { status: 400 }
      );
    }

    const whatsappMessage = await prisma.whatsAppMessage.findFirst({
      where: {
        chatId: contactId,
        fromMe: false,
      },
    });
    let contact;
    if (whatsappMessage) {
      contact = await prisma.whatsAppContact.findUnique({
        where: { id: whatsappMessage.contactId ?? "" },
        select: { id: true, phone: true, sessionId: true },
      });
    }

    if (!contact) {
      return NextResponse.json(
        { status: false, error: "Contato não encontrado" },
        { status: 404 }
      );
    }

    // const sessionRecord = await prisma.whatsAppSession.findUnique({
    //   where: { id: contact.sessionId },
    //   select: { sessionName: true },
    // });
    // if (!sessionRecord || sessionRecord.sessionName !== sessionName) {
    //   return NextResponse.json(
    //     { status: false, error: "Contato não pertence à sessão informada" },
    //     { status: 400 }
    //   );
    // }

    // usuário atual (para atribuir um campaing minimalista)
    const nextSession = await getServerSession().catch(() => null);
    const user = nextSession?.user?.email
      ? await prisma.team.findFirst({
          where: { email: nextSession.user.email },
        })
      : null;

    // cria uma campanha mínima apenas para aproveitar a fila CampaignDispatch
    const campaign = await prisma.campaing.create({
      data: {
        name: `agendado_${DateTime.now().toISO()}`,
        userId: user?.id ?? null,
      },
    });

    // monta payload compatível
    const payload: MessagePayload = {
      type,
      text: text ?? null,
      imageUrl: imageUrl ?? null,
      videoUrl: videoUrl ?? null,
      audioUrl: audioUrl ?? null,
      documentUrl: documentUrl ?? null,
    };

    let parsedDate: Date | null = null;
    if (scheduledAt) {
      try {
        // Tenta parsear com Luxon primeiro
        const luxonDate = DateTime.fromISO(scheduledAt);
        if (luxonDate.isValid) {
          parsedDate = luxonDate.toJSDate();
        } else {
          // Fallback para Date nativo se Luxon falhar
          const d = new Date(scheduledAt);
          if (isNaN(d.getTime())) {
            return NextResponse.json(
              { status: false, error: "scheduledAt inválido" },
              { status: 400 }
            );
          }
          parsedDate = d;
        }
      } catch (error) {
        // Fallback para Date nativo em caso de erro
        const d = new Date(scheduledAt);
        if (isNaN(d.getTime())) {
          return NextResponse.json(
            { status: false, error: "scheduledAt inválido" },
            { status: 400 }
          );
        }
        parsedDate = d;
      }
    }

    // Enfileira 1 registro
    await prisma.campaignDispatch.create({
      data: {
        campaignId: campaign.id,
        sessionName: session.sessionName,
        contact: contact.phone.replace(/[^\d]/g, ""),
        message: JSON.stringify(payload),
        status: "pending",
        scheduledAt: parsedDate,
        messageOrder: 1,
      },
    });

    return NextResponse.json({
      status: true,
      enqueued: 1,
      campaignId: campaign.id,
    });
  } catch (err: any) {
    console.error("[whatsapp/schedule-message] error:", err);
    return NextResponse.json(
      { status: false, error: err?.message || "Erro interno" },
      { status: 500 }
    );
  }
}
