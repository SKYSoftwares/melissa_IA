import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { DateTime } from "luxon";

const prisma = new PrismaClient();

type Contact = { id: string; phone: string };
type TemplateWithMessages = {
  id: string;
  name: string;
  messages: {
    id: string;
    text: string | null;
    audioUrl?: string | null;
    imageUrl?: string | null;
    videoUrl?: string | null;
    documentUrl?: string | null;
    scheduledAt?: Date | null;
  }[];
};

export async function POST(req: NextRequest) {
  try {
    const {
      campaignName,
      segmentId,
      sessionName,
      scheduledAt,
      delay,
      contactDelay,
      templateIds,
    } = await req.json();

    if (!campaignName || !segmentId || !sessionName || !templateIds?.length) {
      return NextResponse.json(
        { status: false, error: "Campos obrigatórios ausentes" },
        { status: 400 }
      );
    }
    const Nextsession = await getServerSession().catch(() => null);
    console.log(Nextsession, "NS");
    const user = await prisma.team.findFirst({
      where: {
        email: Nextsession?.user.email ?? "",
      },
    });
    let parsedDate: Date | null = null;
    if (scheduledAt) {
      try {
        // Tenta parsear com Luxon primeiro
        const luxonDate = DateTime.fromISO(scheduledAt);
        if (luxonDate.isValid) {
          parsedDate = luxonDate.toJSDate();
        } else {
          // Fallback para Date nativo se Luxon falhar
          parsedDate = new Date(scheduledAt);
          if (isNaN(parsedDate.getTime())) {
            return NextResponse.json(
              { status: false, error: "scheduledAt inválido" },
              { status: 400 }
            );
          }
        }
      } catch (error) {
        // Fallback para Date nativo em caso de erro
        parsedDate = new Date(scheduledAt);
        if (isNaN(parsedDate.getTime())) {
          return NextResponse.json(
            { status: false, error: "scheduledAt inválido" },
            { status: 400 }
          );
        }
      }
    }

    // 1) Valida sessão conectada
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

    console.log(user?.id, "UserId");
    const campaign = await prisma.campaing.create({
      data: {
        name: campaignName,
        delay: delay ?? 30000,
        contactDelay: contactDelay ?? 10000,
        userId: user?.id,
        templates: {
          create: templateIds.map((templateId: string) => ({
            template: { connect: { id: templateId } },
          })),
        },
      },
      include: {
        templates: {
          include: {
            template: {
              include: { messages: { orderBy: { createdAt: "asc" } } },
            },
          },
        },
      },
    });

    const templates: TemplateWithMessages[] = campaign.templates.map(
      (t) => t.template
    ) as any;

    if (!templates.length) {
      return NextResponse.json(
        { status: false, error: "Nenhum template associado" },
        { status: 400 }
      );
    }

    // 3) Busca contatos do segmento
    const segment = await prisma.segment.findUnique({
      where: { id: segmentId },
      select: {
        id: true,
        name: true,
        contacts: { select: { id: true, phone: true, name: true } },
      },
    });

    if (!segment || !segment.contacts.length) {
      return NextResponse.json(
        { status: false, error: "Segmento vazio ou não encontrado" },
        { status: 400 }
      );
    }

    // 4) Monta registros de disparo
    const rows: {
      campaignId: string;
      sessionName: string;
      contact: string;
      message: string;
      status: "pending";
      scheduledAt?: Date | null;
      messageOrder: number;
    }[] = [];

    const normalizePhone = (p: string) => p.replace(/[^\d]/g, "");

    segment.contacts.forEach((c: Contact, index) => {
      const phone = normalizePhone(c.phone);
      if (!phone) return;

      let orderCounter = 1;

      // pega o template correspondente à posição do contato
      const tpl = templates[index % templates.length];

      tpl.messages.forEach((m) => {
        const type = m.audioUrl
          ? "audio"
          : m.imageUrl
          ? "image"
          : m.videoUrl
          ? "video"
          : m.documentUrl
          ? "document"
          : "text";

        const payload = JSON.stringify({
          type,
          text: m.text,
          audioUrl: m.audioUrl || null,
          imageUrl: m.imageUrl || null,
          videoUrl: m.videoUrl || null,
          documentUrl: m.documentUrl || null,
        });

        const effectiveSchedule = m.scheduledAt
          ? (() => {
              try {
                const luxonDate = DateTime.fromJSDate(new Date(m.scheduledAt));
                return luxonDate.isValid ? luxonDate.toJSDate() : new Date(m.scheduledAt);
              } catch {
                return new Date(m.scheduledAt);
              }
            })()
          : parsedDate || null;

        rows.push({
          campaignId: campaign.id,
          sessionName: session.sessionName,
          contact: phone,
          message: payload,
          status: "pending",
          scheduledAt: effectiveSchedule,
          messageOrder: orderCounter++,
        });
      });
    });

    if (!rows.length) {
      return NextResponse.json(
        { status: false, error: "Nada para enfileirar" },
        { status: 400 }
      );
    }

    // 5) Salva no banco
    const batch = await prisma.campaignDispatch.createMany({
      data: rows,
      skipDuplicates: false,
    });

    return NextResponse.json({
      status: true,
      enqueued: batch.count,
      campaignId: campaign.id,
      sessionName: session.sessionName,
      segmentId: segment.id,
    });
  } catch (err: any) {
    console.error("[create-and-send] error:", err);
    return NextResponse.json(
      { status: false, error: err.message || "Erro interno" },
      { status: 500 }
    );
  }
}
