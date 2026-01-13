import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("q") || "";
    const { id } = params;

    const messages = await prisma.campaignDispatch.findMany({
      where: {
        campaignId: id,
        OR: search
          ? [
              { contact: { contains: search } },
              { message: { contains: search } },
            ]
          : undefined,
      },
      select: {
        id: true,
        contact: true,
        message: true,
        status: true,
        error: true,
        updatedAt: true,
      },
      orderBy: [
        { contact: "asc" },
        { messageOrder: "asc" },
        { updatedAt: "asc" },
      ],
    });

    // Agrupar por contato
    const grouped: Record<string, any[]> = {};
    messages.forEach((m) => {
      if (!grouped[m.contact]) grouped[m.contact] = [];
      grouped[m.contact].push({
        id: m.id,
        status: m.status,
        error: m.error,
        updatedAt: m.updatedAt,
        ...JSON.parse(m.message || "{}"),
      });
    });

    const contacts = Object.entries(grouped).map(([contact, msgs]) => ({
      contact,
      messages: msgs,
    }));

    return NextResponse.json({ status: true, contacts });
  } catch (err: any) {
    console.error("Erro ao buscar mensagens da campanha:", err);
    return NextResponse.json(
      { status: false, error: err.message },
      { status: 500 }
    );
  }
}
