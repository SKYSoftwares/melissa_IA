import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const contactId = searchParams.get("contactId");
    const sessionName = searchParams.get("sessionName");

    if (!contactId || !sessionName) {
      return NextResponse.json(
        { status: false, error: "contactId e sessionName são obrigatórios" },
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

    // const session = await prisma.whatsAppSession.findUnique({
    //   where: { id: contact.sessionId },
    //   select: { sessionName: true },
    // });
    // if (!session || session.sessionName !== sessionName) {
    //   return NextResponse.json(
    //     { status: false, error: "Contato não pertence à sessão" },
    //     { status: 400 }
    //   );
    // }

    const phoneDigits = contact.phone.replace(/[^\d]/g, "");

    const items = await prisma.campaignDispatch.findMany({
      where: {
        sessionName,
        contact: phoneDigits,
        status: "pending",
        deletedAt: null,
      },
      orderBy: [{ scheduledAt: "asc" }, { createdAt: "asc" }],
      select: {
        id: true,
        message: true,
        scheduledAt: true,
        createdAt: true,
        status: true,
      },
    });

    const parsed = items.map((i) => {
      let msg: any = null;
      try {
        msg = JSON.parse(i.message);
      } catch {}
      return { ...i, parsedMessage: msg };
    });

    return NextResponse.json({ status: true, items: parsed });
  } catch (err: any) {
    console.error("[whatsapp/scheduled][GET] error:", err);
    return NextResponse.json(
      { status: false, error: err?.message || "Erro interno" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { status: false, error: "id é obrigatório" },
        { status: 400 }
      );
    }

    // marcar como cancelado (status) e soft-delete
    await prisma.campaignDispatch.update({
      where: { id },
      data: { status: "cancelled", deletedAt: new Date() },
    });

    return NextResponse.json({ status: true, cancelled: id });
  } catch (err: any) {
    console.error("[whatsapp/scheduled][DELETE] error:", err);
    return NextResponse.json(
      { status: false, error: err?.message || "Erro interno" },
      { status: 500 }
    );
  }
}
