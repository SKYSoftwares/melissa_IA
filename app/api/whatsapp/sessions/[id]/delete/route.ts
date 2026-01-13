import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const session = await prisma.whatsAppSession.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        isActive: false,
        connectionStatus: "DISCONNECTED",
      },
    });

    return NextResponse.json({
      status: true,
      message: "Sessão marcada como deletada",
      session,
    });
  } catch (err: any) {
    console.error("❌ Erro ao deletar sessão:", err);
    return NextResponse.json(
      { status: false, error: err.message || "Erro interno" },
      { status: 500 }
    );
  }
}
