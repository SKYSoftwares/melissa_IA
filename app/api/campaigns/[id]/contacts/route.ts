import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const contacts = await prisma.campaignDispatch.findMany({
      where: { campaignId: id, status: "sent" }, // só contatos que receberam
      select: {
        contact: true,
        status: true,
        updatedAt: true,
        error: true,
      },
      distinct: ["contact"], // evita duplicados
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ status: true, contacts });
  } catch (err: any) {
    console.error("Erro ao buscar contatos da campanha:", err);
    return NextResponse.json(
      { status: false, error: err.message },
      { status: 500 }
    );
  }
}
