import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params; // ✅ AQUI ESTÁ A CORREÇÃO

    if (!id) {
      return NextResponse.json(
        { status: false, error: "ID não informado" },
        { status: 400 }
      );
    }

    await prisma.whatsAppSession.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        isActive: false,
        connectionStatus: "DISCONNECTED",
      },
    });

    return NextResponse.json({
      status: true,
      message: "Sessão deletada com sucesso",
    });
  } catch (err: any) {
    console.error("❌ Erro ao deletar sessão:", err);
    return NextResponse.json(
      { status: false, error: err.message || "Erro interno" },
      { status: 500 }
    );
  }
}
